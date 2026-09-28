import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../core/api/api_client.dart';
import '../../core/repositories/subscription_repository.dart';
import 'subscription_providers.dart';

/// Apple product ids configured in App Store Connect's "RatnSetu Plans"
/// subscription group -- must exactly match
/// Backend/seed/seedSubscriptionPlans.js's appleProductId values
/// (Ratnsetu -> basic, Ratnsetu1 -> pro). This list only decides which
/// products to *ask the App Store about*; which internal plan each one
/// grants is still decided authoritatively by the backend via
/// SubscriptionPlan.appleProductId, never assumed here.
const kAppleSubscriptionProductIds = <String>{'Ratnsetu', 'Ratnsetu1'};

enum AppleIapStatus { idle, loadingProducts, purchasing, restoring }

class AppleIapState {
  final AppleIapStatus status;
  final List<ProductDetails> products;
  final String? purchasingProductId;
  final String? error;
  final bool storeUnavailable;
  // This firm's Apple app-account token (see subscription_repository.dart's
  // getAppleAppAccountToken) -- null until fetched. The backend now FAILS
  // CLOSED without a matching token (Backend/Utils/appleIap.js's
  // appAccountTokenMatches), so buy() below refuses to start a purchase
  // until this is non-null -- see appAccountTokenLoading/Failed.
  final String? appAccountToken;
  // True from construction until the first getAppleAppAccountToken() call
  // resolves (success or failure) -- buy() checks this (not just
  // appAccountToken == null) so it can distinguish "still loading" from
  // "loaded and still somehow null", though in practice a successful load
  // always yields a non-empty token.
  final bool appAccountTokenLoading;
  // True if the most recent getAppleAppAccountToken() call failed. Drives
  // the UI's retry affordance; buy() refuses to start while this is true.
  final bool appAccountTokenFailed;

  const AppleIapState({
    this.status = AppleIapStatus.idle,
    this.products = const [],
    this.purchasingProductId,
    this.error,
    this.storeUnavailable = false,
    this.appAccountToken,
    this.appAccountTokenLoading = true,
    this.appAccountTokenFailed = false,
  });

  AppleIapState copyWith({
    AppleIapStatus? status,
    List<ProductDetails>? products,
    String? purchasingProductId,
    bool clearPurchasingProductId = false,
    String? error,
    bool clearError = false,
    bool? storeUnavailable,
    String? appAccountToken,
    bool? appAccountTokenLoading,
    bool? appAccountTokenFailed,
  }) {
    return AppleIapState(
      status: status ?? this.status,
      products: products ?? this.products,
      purchasingProductId: clearPurchasingProductId
          ? null
          : (purchasingProductId ?? this.purchasingProductId),
      error: clearError ? null : (error ?? this.error),
      storeUnavailable: storeUnavailable ?? this.storeUnavailable,
      appAccountToken: appAccountToken ?? this.appAccountToken,
      appAccountTokenLoading: appAccountTokenLoading ?? this.appAccountTokenLoading,
      appAccountTokenFailed: appAccountTokenFailed ?? this.appAccountTokenFailed,
    );
  }
}

/// Whether [AppleIapController.buy] is allowed to actually start a
/// StoreKit purchase. Pure -- no I/O, no platform channels -- so it's
/// directly unit-testable without any StoreKit/mock-platform setup,
/// mirroring the backend's fail-closed requirement (Backend/Utils/
/// appleIap.js's appAccountTokenMatches): a purchase must never start
/// while the firm's Apple token is still loading or failed/absent, since
/// the backend would reject it anyway.
bool canStartApplePurchase(AppleIapState state) {
  if (state.appAccountTokenLoading) return false;
  if (state.appAccountToken == null) return false;
  return true;
}

/// Owns the single StoreKit purchase-stream subscription for the app's
/// lifetime -- created lazily the first time something watches
/// [appleIapControllerProvider] (SubscriptionScreen, on iOS only) and then
/// kept alive by Riverpod rather than torn down on navigation, so a
/// purchase/restore outcome that arrives while the subscription screen
/// isn't mounted is never missed, and re-opening that screen never
/// registers a second listener.
///
/// Deliberately NOT built as an implementation of the same interface as
/// the existing Razorpay flow in subscription_screen.dart -- StoreKit's
/// stream-based purchase model (pending/purchased/restored/error/canceled
/// events that can arrive at any time, including after app restart) has a
/// different shape than razorpay_flutter's one-shot success/error
/// callbacks, and forcing both into one shared interface would have meant
/// rewriting the existing, working Razorpay callbacks to fit it.
class AppleIapController extends StateNotifier<AppleIapState> {
  final InAppPurchase _iap;
  final SubscriptionRepository _subscriptionRepository;
  final Future<void> Function() _onEntitlementChanged;
  StreamSubscription<List<PurchaseDetails>>? _purchaseSub;

  AppleIapController(this._iap, this._subscriptionRepository, this._onEntitlementChanged)
    : super(const AppleIapState()) {
    _init();
  }

  Future<void> _init() async {
    final available = await _iap.isAvailable();
    if (!available) {
      state = state.copyWith(storeUnavailable: true);
      return;
    }
    _purchaseSub = _iap.purchaseStream.listen(
      _onPurchaseUpdate,
      onError: (error) => state = state.copyWith(
        status: AppleIapStatus.idle,
        clearPurchasingProductId: true,
        error: 'Store connection error: $error',
      ),
    );
    // Runs concurrently with loadProducts() below (product listing doesn't
    // depend on it), but buy() itself refuses to proceed until this
    // resolves -- see buy()'s guard. Not awaited here only so it doesn't
    // delay showing the product list while the token round-trip is
    // in flight.
    unawaited(_loadAppAccountToken());
    await loadProducts();
  }

  Future<void> _loadAppAccountToken() async {
    state = state.copyWith(appAccountTokenLoading: true, appAccountTokenFailed: false);
    try {
      final token = await _subscriptionRepository.getAppleAppAccountToken();
      state = state.copyWith(appAccountToken: token, appAccountTokenLoading: false);
    } catch (_) {
      state = state.copyWith(appAccountTokenLoading: false, appAccountTokenFailed: true);
    }
  }

  /// Lets the UI retry after a failed token load (see buy()'s guard) --
  /// e.g. a "Retry" button shown alongside "Could not prepare your
  /// purchase" in subscription_screen.dart.
  Future<void> retryLoadAppAccountToken() => _loadAppAccountToken();

  /// Queries the App Store for the real, localized product info (including
  /// price) -- the displayed price on iOS must come from here, never from
  /// the backend's plan.price, since only Apple knows the customer's actual
  /// storefront/currency/localized price string.
  Future<void> loadProducts() async {
    state = state.copyWith(status: AppleIapStatus.loadingProducts, clearError: true);
    try {
      final response = await _iap.queryProductDetails(kAppleSubscriptionProductIds);
      if (response.error != null) {
        state = state.copyWith(
          status: AppleIapStatus.idle,
          error: 'Could not load plans from the App Store',
        );
        return;
      }
      if (response.productDetails.isEmpty) {
        state = state.copyWith(
          status: AppleIapStatus.idle,
          error: 'No subscription products are available right now',
        );
        return;
      }
      state = state.copyWith(status: AppleIapStatus.idle, products: response.productDetails);
    } catch (e) {
      state = state.copyWith(status: AppleIapStatus.idle, error: 'Could not load plans: $e');
    }
  }

  /// Refuses to start a purchase until the firm's appAccountToken has
  /// loaded -- the backend now FAILS CLOSED without one (see
  /// Backend/Utils/appleIap.js's appAccountTokenMatches: a missing token on
  /// either side is a rejection, not a pass-through), so starting a
  /// purchase we already know would be rejected server-side would just
  /// waste a real StoreKit purchase sheet interaction for nothing. This
  /// check is synchronous and runs before any `await`, so there is no
  /// window in which a call arriving while the token is mid-load could
  /// slip through.
  Future<void> buy(ProductDetails product) async {
    if (!canStartApplePurchase(state)) {
      state = state.copyWith(
        // Defensively also failed (not just loading) if appAccountToken
        // somehow ended up null after loading already finished -- never
        // silently continue with no token; surface a retryable error.
        appAccountTokenFailed: !state.appAccountTokenLoading,
        error: state.appAccountTokenLoading
            ? 'Still preparing your purchase -- please try again in a moment.'
            : 'Could not prepare your purchase. Tap Retry and try again.',
      );
      return;
    }

    state = state.copyWith(
      status: AppleIapStatus.purchasing,
      purchasingProductId: product.id,
      clearError: true,
    );
    // applicationUserName is the cross-platform in_app_purchase name for
    // what in_app_purchase_storekit (0.4.13, the version installed here --
    // see in_app_purchase_storekit_platform.dart) passes straight through
    // as StoreKit's appAccountToken. Guaranteed non-null here by the guard
    // above -- never generated locally, always the firm's own token from
    // the backend (see AppleIapState doc comment).
    final param = PurchaseParam(productDetails: product, applicationUserName: state.appAccountToken);
    // The outcome arrives asynchronously via purchaseStream
    // (_onPurchaseUpdate below), not via this call's return value --
    // buyNonConsumable only opens the purchase sheet. Auto-renewable
    // subscriptions go through the same non-consumable API on iOS; Apple's
    // StoreKit tracks the actual renewal behavior server-side.
    final started = await _iap.buyNonConsumable(purchaseParam: param);
    if (!started) {
      state = state.copyWith(
        status: AppleIapStatus.idle,
        clearPurchasingProductId: true,
        error: 'Could not start the purchase',
      );
    }
  }

  Future<void> restorePurchases() async {
    state = state.copyWith(status: AppleIapStatus.restoring, clearError: true);
    try {
      // NOTE (corrected -- an earlier comment here was wrong): this
      // package (in_app_purchase_storekit 0.4.13) defaults to
      // `_useStoreKit2 = true`, and under that path its restorePurchases()
      // calls `SK2Transaction.restorePurchases()` with NO arguments at
      // all -- `applicationUserName` below is silently dropped and has NO
      // EFFECT (confirmed by reading
      // in_app_purchase_storekit_platform.dart:237-247; it's only honored
      // on the legacy StoreKit-1 fallback path). This is passed anyway for
      // that StoreKit-1 fallback, and is harmless either way: a restored
      // PurchaseDetails still carries whatever appAccountToken Apple
      // embedded in the ORIGINAL transaction at the time it was first
      // purchased (see AppStorePurchaseDetails.appAccountToken), which is
      // what the backend actually re-verifies in _verifyAndFinish below --
      // NOT anything passed to this call. The backend's ownership +
      // appAccountToken checks are the sole authority here; nothing about
      // "who is logged in right now" ever factors into activation.
      await _iap.restorePurchases(applicationUserName: state.appAccountToken);
      // Outcomes (including "nothing to restore", which simply produces no
      // further stream events) surface through _onPurchaseUpdate too.
    } catch (e) {
      state = state.copyWith(status: AppleIapStatus.idle, error: 'Restore failed: $e');
    }
  }

  Future<void> _onPurchaseUpdate(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      switch (purchase.status) {
        case PurchaseStatus.pending:
          state = state.copyWith(status: AppleIapStatus.purchasing);
          break;

        case PurchaseStatus.error:
          state = state.copyWith(
            status: AppleIapStatus.idle,
            clearPurchasingProductId: true,
            error: purchase.error?.message ?? 'Purchase failed',
          );
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;

        case PurchaseStatus.canceled:
          state = state.copyWith(status: AppleIapStatus.idle, clearPurchasingProductId: true);
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;

        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          await _verifyAndFinish(purchase);
          break;
      }
    }
  }

  /// The only place a purchase actually grants entitlement: sends the
  /// StoreKit transaction id to the backend, which independently
  /// re-verifies it against Apple's own servers before activating anything
  /// (Backend/Utils/appleIap.js) -- never activates based on local device
  /// state alone. Used identically for a fresh purchase and for Restore
  /// Purchases, since both arrive through this same stream as `purchased`/
  /// `restored` events.
  ///
  /// Only finishes the StoreKit transaction (`completePurchase`) AFTER the
  /// backend confirms activation. If the network drops or the backend is
  /// briefly unreachable right after payment, the transaction is left
  /// unfinished on purpose, so StoreKit redelivers it (next app launch, or
  /// the next Restore Purchases) instead of silently losing it --
  /// verifyApplePurchase is idempotent server-side, so a redelivered
  /// transaction is always safe to resubmit.
  Future<void> _verifyAndFinish(PurchaseDetails purchase) async {
    final transactionId = purchase.purchaseID;
    if (transactionId == null || transactionId.isEmpty) {
      state = state.copyWith(
        status: AppleIapStatus.idle,
        clearPurchasingProductId: true,
        error: 'Purchase is missing a transaction id',
      );
      return;
    }
    try {
      await _subscriptionRepository.verifyApplePurchase(
        transactionId: transactionId,
        productId: purchase.productID,
      );
      await _onEntitlementChanged();
      state = state.copyWith(status: AppleIapStatus.idle, clearPurchasingProductId: true);
    } on ApiException catch (e) {
      state = state.copyWith(
        status: AppleIapStatus.idle,
        clearPurchasingProductId: true,
        error: e.message,
      );
      return;
    } catch (e) {
      state = state.copyWith(
        status: AppleIapStatus.idle,
        clearPurchasingProductId: true,
        error: 'Could not verify purchase: $e',
      );
      return;
    }
    if (purchase.pendingCompletePurchase) {
      await _iap.completePurchase(purchase);
    }
  }

  @override
  void dispose() {
    _purchaseSub?.cancel();
    super.dispose();
  }
}

final appleIapControllerProvider = StateNotifierProvider<AppleIapController, AppleIapState>((
  ref,
) {
  final repo = ref.watch(subscriptionRepositoryProvider);
  return AppleIapController(
    InAppPurchase.instance,
    repo,
    () => ref.read(subscriptionControllerProvider.notifier).refresh(),
  );
});
