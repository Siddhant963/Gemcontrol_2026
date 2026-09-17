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
}

final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return SubscriptionRepository(ref.watch(apiClientProvider));
});
