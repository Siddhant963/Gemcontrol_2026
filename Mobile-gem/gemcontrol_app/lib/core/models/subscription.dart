class SubscriptionPlan {
  final String id;
  final String key;
  final String name;
  final double price;
  final String billingInterval;
  final int maxStaff;
  final List<String> features;

  SubscriptionPlan({
    required this.id,
    required this.key,
    required this.name,
    required this.price,
    required this.billingInterval,
    required this.maxStaff,
    required this.features,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => SubscriptionPlan(
    id: json['_id'] ?? '',
    key: json['key'] ?? '',
    name: json['name'] ?? '',
    price: (json['price'] as num?)?.toDouble() ?? 0,
    billingInterval: json['billingInterval'] ?? 'month',
    maxStaff: (json['maxStaff'] as num?)?.toInt() ?? 0,
    features: (json['features'] as List?)?.map((e) => e.toString()).toList() ?? [],
  );
}

class Subscription {
  final String id;
  final String status; // trialing | active | expired | cancelled
  final DateTime? startDate;
  final DateTime? endDate;
  final String paymentProvider;
  final SubscriptionPlan? plan;

  Subscription({
    required this.id,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.paymentProvider,
    this.plan,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    final plan = json['plan'];
    return Subscription(
      id: json['_id'] ?? '',
      status: json['status'] ?? 'expired',
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate']) : null,
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate']) : null,
      paymentProvider: json['paymentProvider'] ?? 'none',
      plan: plan is Map<String, dynamic> ? SubscriptionPlan.fromJson(plan) : null,
    );
  }
}

/// Response shape of GET /getMySubscription -- `subscription` is null for a
/// firm-less account, non-null but possibly inactive otherwise.
class MySubscription {
  final Subscription? subscription;
  final bool isActive;

  MySubscription({required this.subscription, required this.isActive});

  factory MySubscription.fromJson(Map<String, dynamic> json) => MySubscription(
    subscription: json['subscription'] is Map<String, dynamic>
        ? Subscription.fromJson(json['subscription'])
        : null,
    isActive: json['isActive'] ?? false,
  );
}

/// Response shape of POST /createSubscriptionOrder -- everything the
/// razorpay_flutter checkout sheet needs to open.
class SubscriptionOrder {
  final String orderId;
  final int amount;
  final String currency;
  final String keyId;
  final SubscriptionPlan plan;

  SubscriptionOrder({
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.keyId,
    required this.plan,
  });

  factory SubscriptionOrder.fromJson(Map<String, dynamic> json) => SubscriptionOrder(
    orderId: json['orderId'] ?? '',
    amount: (json['amount'] as num?)?.toInt() ?? 0,
    currency: json['currency'] ?? 'INR',
    keyId: json['keyId'] ?? '',
    plan: SubscriptionPlan.fromJson(json['plan'] as Map<String, dynamic>),
  );
}
