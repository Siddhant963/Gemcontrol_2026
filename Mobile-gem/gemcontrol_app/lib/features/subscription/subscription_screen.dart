import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/models/subscription.dart';
import '../../core/repositories/subscription_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'apple_iap_controller.dart';
import 'subscription_providers.dart';

final _plansProvider = FutureProvider.autoDispose<List<SubscriptionPlan>>((ref) {
  return ref.watch(subscriptionRepositoryProvider).getPlans();
});

int _daysLeft(DateTime? endDate) {
  if (endDate == null) return 0;
  final ms = endDate.difference(DateTime.now()).inMilliseconds;
  return (ms / (24 * 60 * 60 * 1000)).ceil().clamp(0, 1 << 30);
}

/// Matches a backend [SubscriptionPlan] to the StoreKit [ProductDetails]
/// Apple returned, via the plan's own `appleProductId` (never a hardcoded
/// id here) -- null if that product hasn't loaded yet or doesn't exist.
ProductDetails? _appleProductFor(SubscriptionPlan plan, List<ProductDetails> products) {
  if (plan.appleProductId == null) return null;
  for (final product in products) {
    if (product.id == plan.appleProductId) return product;
  }
  return null;
}

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  late final Razorpay _razorpay;
  String? _activatingKey;
  String? _pendingPlanKey;
  String? _error;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _subscribe(SubscriptionPlan plan) async {
    setState(() {
      _activatingKey = plan.key;
      _pendingPlanKey = plan.key;
      _error = null;
    });
    try {
      final order = await ref.read(subscriptionRepositoryProvider).createOrder(plan.key);
      _razorpay.open({
        'key': order.keyId,
        'amount': order.amount,
        'currency': order.currency,
        'order_id': order.orderId,
        'name': 'RatnSetu',
        'description': '${plan.name} plan',
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _activatingKey = null;
      });
    }
  }

  // razorpay_flutter's success response uses camelCase, unprefixed fields
  // (orderId/paymentId/signature) -- NOT the web Checkout callback's
  // razorpay_order_id/razorpay_payment_id/razorpay_signature shape. Mapped
  // explicitly here before calling the backend, which expects the latter.
  Future<void> _onPaymentSuccess(PaymentSuccessResponse response) async {
    final planKey = _pendingPlanKey;
    if (planKey == null) return;
    try {
      await ref.read(subscriptionRepositoryProvider).verifyPayment(
            orderId: response.orderId ?? '',
            paymentId: response.paymentId ?? '',
            signature: response.signature ?? '',
            planKey: planKey,
          );
      await ref.read(subscriptionControllerProvider.notifier).refresh();
      if (mounted) context.go('/home');
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _activatingKey = null);
    }
  }

  void _onPaymentError(PaymentFailureResponse response) {
    setState(() {
      _error = response.message?.isNotEmpty == true ? response.message : 'Payment failed';
      _activatingKey = null;
    });
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    setState(() => _activatingKey = null);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final session = ref.watch(authControllerProvider).valueOrNull;
    final isAdmin = session?.isAdmin ?? false;
    final subAsync = ref.watch(subscriptionControllerProvider);
    final plansAsync = ref.watch(_plansProvider);

    final sub = subAsync.valueOrNull?.subscription;
    final isTrialing = sub?.status == 'trialing' && (subAsync.valueOrNull?.isActive ?? false);

    // iOS must buy through Apple StoreKit, never Razorpay -- Android/Web
    // below are completely untouched and still go through _subscribe.
    // appleIapControllerProvider is only ever watched here, on iOS, so
    // Android never opens a Play Billing connection it isn't meant to use.
    final isIOS = Platform.isIOS;
    final appleState = isIOS ? ref.watch(appleIapControllerProvider) : null;
    final appleError = appleState?.error;

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Subscription'),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_plansProvider);
          await ref.read(subscriptionControllerProvider.notifier).refresh();
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            Text(
              isTrialing
                  ? 'Your free trial is active — ${_daysLeft(sub?.endDate)} day(s) left.'
                  : sub != null
                      ? 'Your subscription has ended. Pick a plan below to keep using RatnSetu.'
                      : 'Pick a plan below to start using RatnSetu.',
              style: TextStyle(color: scheme.onSurfaceVariant),
            ),
            const SizedBox(height: AppSpacing.md),
            if (!isAdmin)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Text(
                  "Only your shop's admin can subscribe or renew. Please contact them.",
                  style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13),
                ),
              ),
            if (isIOS && isAdmin)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: appleState?.status == AppleIapStatus.restoring
                      ? null
                      : () => ref.read(appleIapControllerProvider.notifier).restorePurchases(),
                  child: Text(
                    appleState?.status == AppleIapStatus.restoring
                        ? 'Restoring...'
                        : 'Restore Purchases',
                  ),
                ),
              ),
            if (_error != null || appleError != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Card(
                  color: scheme.errorContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.sm + 4),
                    child: Text(
                      _error ?? appleError!,
                      style: TextStyle(color: scheme.onErrorContainer),
                    ),
                  ),
                ),
              ),
            if (isIOS && appleState?.storeUnavailable == true)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Text(
                  'The App Store is unavailable right now. Please try again later.',
                  style: TextStyle(color: scheme.error, fontSize: 13),
                ),
              ),
            plansAsync.when(
              data: (plans) => Column(
                children: [
                  for (final plan in plans) ...[
                    _PlanCard(
                      plan: plan,
                      isCurrentPlan: sub?.plan?.id == plan.id,
                      isAdmin: isAdmin,
                      isRenewal: isTrialing || sub != null,
                      isIOS: isIOS,
                      // Android/Web: unchanged Razorpay path.
                      isActivating: _activatingKey == plan.key,
                      onTap: () => _subscribe(plan),
                      // iOS: Apple StoreKit path -- same card design, only
                      // the price source and the purchase action differ.
                      appleProduct: isIOS
                          ? _appleProductFor(plan, appleState?.products ?? const [])
                          : null,
                      isApplePurchasing:
                          isIOS &&
                          appleState?.status == AppleIapStatus.purchasing &&
                          appleState?.purchasingProductId == plan.appleProductId,
                      onAppleTap: (product) =>
                          ref.read(appleIapControllerProvider.notifier).buy(product),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                ],
              ),
              loading: () => const Center(child: Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.xl),
                child: CircularProgressIndicator(),
              )),
              error: (_, __) => Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
                  child: Text('Failed to load plans', style: TextStyle(color: scheme.error)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final bool isCurrentPlan;
  final bool isAdmin;
  final bool isActivating;
  final bool isRenewal;
  final VoidCallback onTap;
  // iOS-only (all null/false on Android/Web, which keep using the fields
  // above via [onTap] exactly as before):
  final bool isIOS;
  final ProductDetails? appleProduct;
  final bool isApplePurchasing;
  final ValueChanged<ProductDetails>? onAppleTap;

  const _PlanCard({
    required this.plan,
    required this.isCurrentPlan,
    required this.isAdmin,
    required this.isActivating,
    required this.isRenewal,
    required this.onTap,
    this.isIOS = false,
    this.appleProduct,
    this.isApplePurchasing = false,
    this.onAppleTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    // On iOS the displayed price must come from Apple's own product info
    // (localized to the customer's storefront/currency), never from the
    // backend's plan.price -- fall back to the backend price only while
    // Apple's product hasn't loaded yet, so the card isn't left blank.
    final priceText = (isIOS && appleProduct != null)
        ? appleProduct!.price
        : '₹${plan.price.toStringAsFixed(0)}';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(plan.name, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  priceText,
                  style: AppTheme.numericData(context, color: scheme.primary).copyWith(fontSize: 22),
                ),
                const SizedBox(width: 4),
                Text('/${plan.billingInterval}', style: TextStyle(color: scheme.onSurfaceVariant)),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            for (final feature in plan.features)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_outline, size: 16, color: scheme.secondary),
                    const SizedBox(width: 8),
                    Expanded(child: Text(feature, style: const TextStyle(fontSize: 13))),
                  ],
                ),
              ),
            const SizedBox(height: AppSpacing.sm),
            if (isCurrentPlan)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: Text(
                  'Your current plan',
                  style: TextStyle(color: scheme.secondary, fontWeight: FontWeight.w600, fontSize: 12),
                ),
              ),
            SizedBox(
              width: double.infinity,
              // Deliberately still tappable when this is the current plan --
              // a user may want to renew/extend it early rather than wait
              // for it to lapse. Only "not an admin" or "checkout already
              // opening" should block the tap.
              child: isIOS
                  ? ElevatedButton(
                      onPressed: (!isAdmin || isApplePurchasing || appleProduct == null)
                          ? null
                          : () => onAppleTap?.call(appleProduct!),
                      child: Text(
                        isApplePurchasing
                            ? 'Purchasing...'
                            : appleProduct == null
                                ? 'Unavailable'
                                : (isCurrentPlan || isRenewal)
                                    ? 'Renew'
                                    : 'Subscribe',
                      ),
                    )
                  : ElevatedButton(
                      onPressed: (!isAdmin || isActivating) ? null : onTap,
                      child: Text(
                        isActivating
                            ? 'Opening checkout...'
                            : (isCurrentPlan || isRenewal)
                                ? 'Renew'
                                : 'Subscribe',
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
