import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/models/subscription.dart';
import '../../core/repositories/subscription_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'subscription_providers.dart';

final _plansProvider = FutureProvider.autoDispose<List<SubscriptionPlan>>((ref) {
  return ref.watch(subscriptionRepositoryProvider).getPlans();
});

int _daysLeft(DateTime? endDate) {
  if (endDate == null) return 0;
  final ms = endDate.difference(DateTime.now()).inMilliseconds;
  return (ms / (24 * 60 * 60 * 1000)).ceil().clamp(0, 1 << 30);
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
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Card(
                  color: scheme.errorContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.sm + 4),
                    child: Text(_error!, style: TextStyle(color: scheme.onErrorContainer)),
                  ),
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
                      isActivating: _activatingKey == plan.key,
                      isRenewal: isTrialing || sub != null,
                      onTap: () => _subscribe(plan),
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

  const _PlanCard({
    required this.plan,
    required this.isCurrentPlan,
    required this.isAdmin,
    required this.isActivating,
    required this.isRenewal,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
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
                  '₹${plan.price.toStringAsFixed(0)}',
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
              child: ElevatedButton(
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
