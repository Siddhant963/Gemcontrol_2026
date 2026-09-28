import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/subscription.dart';

class SubscriptionRepository {
  final ApiClient _client;
  SubscriptionRepository(this._client);

  Future<List<SubscriptionPlan>> getPlans() {
    return _client.request(
      (dio) => dio.get('/getSubscriptionPlans'),
      (data) => (data as List).map((e) => SubscriptionPlan.fromJson(e)).toList(),
    );
  }

  Future<MySubscription> getMySubscription() {
    return _client.request(
      (dio) => dio.get('/getMySubscription'),
      (data) => MySubscription.fromJson(data),
    );
  }

  Future<SubscriptionOrder> createOrder(String planKey) {
    return _client.request(
      (dio) => dio.post('/createSubscriptionOrder', data: {'planKey': planKey}),
      (data) => SubscriptionOrder.fromJson(data),
    );
  }

  /// [orderId]/[paymentId]/[signature] are already the snake_case values the
  /// backend expects -- the caller (subscription_screen.dart) is responsible
  /// for mapping razorpay_flutter's camelCase success-response fields onto
  /// these before calling this method.
  Future<Subscription> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
    required String planKey,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/verifySubscriptionPayment',
        data: {
          'razorpay_order_id': orderId,
          'razorpay_payment_id': paymentId,
          'razorpay_signature': signature,
          'planKey': planKey,
        },
      ),
      (data) => Subscription.fromJson(data['subscription']),
    );
  }

  /// iOS-only counterpart to [verifyPayment] above -- [transactionId] is the
  /// StoreKit transaction id from a `purchased`/`restored` PurchaseDetails
  /// (see apple_iap_controller.dart). [productId] is sent only as an
  /// optional client-side sanity hint; the backend independently re-fetches
  /// and verifies the transaction from Apple's own servers and never trusts
  /// either field for the actual plan/price/expiry.
  Future<Subscription> verifyApplePurchase({
    required String transactionId,
    String? productId,
  }) {
    return _client.request(
      (dio) => dio.post(
        '/verifyAppleSubscription',
        data: {
          'transactionId': transactionId,
          if (productId != null) 'productId': productId,
        },
      ),
      (data) => Subscription.fromJson(data['subscription']),
    );
  }

  /// This firm's stable, one-time-generated Apple "app account token" --
  /// passed on every purchase/restore as StoreKit's appAccountToken (see
  /// apple_iap_controller.dart) so the backend can verify a purchase was
  /// actually made for this firm, not just activated onto whichever firm
  /// happens to be logged in. Always fetched fresh from the backend (the
  /// authoritative source), never generated or cached long-term client-side.
  Future<String> getAppleAppAccountToken() {
    return _client.request(
      (dio) => dio.get('/getAppleAppAccountToken'),
      (data) => data['appAccountToken'] as String,
    );
  }
}

final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return SubscriptionRepository(ref.watch(apiClientProvider));
});
