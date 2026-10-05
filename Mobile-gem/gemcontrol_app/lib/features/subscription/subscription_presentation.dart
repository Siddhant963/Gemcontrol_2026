import '../../core/models/subscription.dart';
import 'subscription_providers.dart';

/// What the Subscription screen should present, derived ONLY from the
/// backend's verified state (GET /getMySubscription -> `isActive` plus the
/// subscription's `status`/`endDate`). Nothing here invents a status:
///   isActive == status is trialing/active AND endDate has not passed
///             (Backend/Utils/subscription.js isSubscriptionCurrentlyActive)
/// The backend stores no auto-renew flag, so "cancelled but active until
/// expiry" is simply an active subscription with a future endDate and is
/// presented as such -- no "Renews on" claim is made.
enum SubscriptionPhase {
  /// No subscription row yet.
  none,

  /// Free trial still running.
  trial,

  /// Paid plan currently granting access.
  active,

  /// Expired or cancelled -- access has ended.
  ended,
}

enum SubscriptionBannerKind { info, success, warning }

class SubscriptionPresentation {
  final SubscriptionPhase phase;
  final bool endedBecauseCancelled;
  final String? planId;
  final String planName;
  final DateTime? endDate;
  final int daysLeft;

  const SubscriptionPresentation({
    required this.phase,
    this.endedBecauseCancelled = false,
    this.planId,
    this.planName = '',
    this.endDate,
    this.daysLeft = 0,
  });

  factory SubscriptionPresentation.from(SubscriptionSession? session, {DateTime? now}) {
    final sub = session?.subscription;
    if (sub == null) return const SubscriptionPresentation(phase: SubscriptionPhase.none);

    final days = _daysLeft(sub.endDate, now ?? DateTime.now());
    SubscriptionPresentation build(SubscriptionPhase phase, {bool cancelled = false}) =>
        SubscriptionPresentation(
          phase: phase,
          endedBecauseCancelled: cancelled,
          planId: sub.plan?.id,
          planName: sub.plan?.name ?? '',
          endDate: sub.endDate,
          daysLeft: days,
        );

    if (session!.isActive) {
      return build(sub.status == 'trialing' ? SubscriptionPhase.trial : SubscriptionPhase.active);
    }
    return build(SubscriptionPhase.ended, cancelled: sub.status == 'cancelled');
  }

  bool get isActive => phase == SubscriptionPhase.active;

  SubscriptionBannerKind get bannerKind => switch (phase) {
    SubscriptionPhase.active => SubscriptionBannerKind.success,
    SubscriptionPhase.ended => SubscriptionBannerKind.warning,
    _ => SubscriptionBannerKind.info,
  };

  String get message => switch (phase) {
    SubscriptionPhase.trial => 'Your free trial is active — $daysLeft day(s) left.',
    SubscriptionPhase.active =>
      '${planName.isNotEmpty ? "You're on the $planName plan" : 'Your subscription is active'}'
          ' — active until ${formatDate(endDate)}.',
    SubscriptionPhase.ended =>
      endedBecauseCancelled
          ? 'Your subscription was cancelled. Pick a plan below to keep using RatnSetu.'
          : 'Your subscription has ended. Pick a plan below to keep using RatnSetu.',
    SubscriptionPhase.none => 'Pick a plan below to start using RatnSetu.',
  };

  /// Only a PAID, currently-active plan is "the current plan". A trial row
  /// (which points at a default plan) or an ended subscription must not mark
  /// that plan as current.
  bool isCurrentPlan(String planId) => isActive && this.planId == planId;

  /// Button label for a plan card. The current plan stays tappable on
  /// purpose (renew/extend early, as before); other plans offer a switch.
  String actionLabel(String planId) {
    if (isCurrentPlan(planId)) return 'Renew';
    return switch (phase) {
      SubscriptionPhase.active => 'Switch plan',
      SubscriptionPhase.ended => 'Renew',
      _ => 'Subscribe',
    };
  }

  static String formatDate(DateTime? d) {
    if (d == null) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final local = d.toLocal();
    return '${local.day} ${months[local.month - 1]} ${local.year}';
  }

  static int _daysLeft(DateTime? end, DateTime now) {
    if (end == null) return 0;
    final ms = end.difference(now).inMilliseconds;
    final days = (ms / (24 * 60 * 60 * 1000)).ceil();
    return days < 0 ? 0 : days;
  }
}

/// Convenience for call sites/tests that only have a model [Subscription].
SubscriptionSession sessionFromVerified(Subscription verified) =>
    SubscriptionSession(isActive: true, subscription: verified);
