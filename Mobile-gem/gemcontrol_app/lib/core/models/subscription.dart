class SubscriptionPlan {
  final String id;
  final String key;
  final String name;
  final double price;
  final String billingInterval;
  final int maxStaff;
  final List<String> features;
  // App Store Connect product id for this plan's iOS auto-renewable
  // subscription (e.g. "Ratnsetu"/"Ratnsetu1") -- null for a plan not sold
  // on iOS, or on a backend that predates this field. This is only ever
  // used to match this plan against a StoreKit ProductDetails id (see
  // apple_iap_controller.dart); the backend's SubscriptionPlan.appleProductId
  // remains the sole source of truth for what each Apple product grants.
  final String? appleProductId;

  SubscriptionPlan({
    required this.id,
    required this.key,
    required this.name,
    required this.price,
    required this.billingInterval,
    required this.maxStaff,
    required this.features,
    this.appleProductId,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => SubscriptionPlan(
    id: json['_id'] ?? '',
    key: json['key'] ?? '',
    name: json['name'] ?? '',
    price: (json['price'] as num?)?.toDouble() ?? 0,
    billingInterval: json['billingInterval'] ?? 'month',
    maxStaff: (json['maxStaff'] as num?)?.toInt() ?? 0,
    features: (json['features'] as List?)?.map((e) => e.toString()).toList() ?? [],
    appleProductId: json['appleProductId'] as String?,
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

/// What the current plan allows, as reported by the backend (the backend
/// ENFORCES these; the app only uses them to explain a limit up front).
/// [staffLimit] 0 = unlimited. Null entitlements (older backend / failed
/// lookup) must be treated as "don't block".
class PlanEntitlements {
  final bool girvi;
  final int staffLimit;
  final int staffUsed;

  const PlanEntitlements({required this.girvi, required this.staffLimit, required this.staffUsed});

  bool get staffLimitReached => staffLimit > 0 && staffUsed >= staffLimit;

  factory PlanEntitlements.fromJson(Map<String, dynamic> json) => PlanEntitlements(
    girvi: json['girvi'] ?? true,
    staffLimit: (json['staffLimit'] as num?)?.toInt() ?? 0,
    staffUsed: (json['staffUsed'] as num?)?.toInt() ?? 0,
  );
}

/// Response shape of GET /getMySubscription -- `subscription` is null for a
/// firm-less account, non-null but possibly inactive otherwise.
class MySubscription {
  final Subscription? subscription;
  final bool isActive;
  final PlanEntitlements? entitlements;

  MySubscription({required this.subscription, required this.isActive, this.entitlements});

  factory MySubscription.fromJson(Map<String, dynamic> json) => MySubscription(
    subscription: json['subscription'] is Map<String, dynamic>
        ? Subscription.fromJson(json['subscription'])
        : null,
    isActive: json['isActive'] ?? false,
    entitlements: json['entitlements'] is Map<String, dynamic>
        ? PlanEntitlements.fromJson(json['entitlements'])
        : null,
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
