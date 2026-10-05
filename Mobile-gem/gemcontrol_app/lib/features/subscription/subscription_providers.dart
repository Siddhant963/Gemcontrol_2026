import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/models/subscription.dart';
import '../../core/repositories/subscription_repository.dart';

class SubscriptionSession {
  final bool isActive;
  final Subscription? subscription;

  const SubscriptionSession({required this.isActive, this.subscription});

  static const inactive = SubscriptionSession(isActive: false);
}

/// Mirrors AuthController's shape (lib/core/auth/auth_state.dart) -- rebuilds
/// whenever auth state changes (login/logout), and flips to inactive
/// immediately on any 402 encountered anywhere in the app, not just an
/// explicit fetch here.
class SubscriptionController extends AsyncNotifier<SubscriptionSession> {
  @override
  Future<SubscriptionSession> build() => _fetch();

  /// [fallback] is what to keep showing if the fetch fails mid-session (a
  /// refresh after a purchase). Only the very first load, with nothing known
  /// yet, fails OPEN.
  Future<SubscriptionSession> _fetch({SubscriptionSession? fallback}) async {
    final authSession = await ref.watch(authControllerProvider.future);
    ref.read(apiClientProvider).onSubscriptionRequired = () {
      state = const AsyncData(SubscriptionSession.inactive);
    };
    if (!authSession.isLoggedIn) return SubscriptionSession.inactive;

    try {
      final mySub = await ref.read(subscriptionRepositoryProvider).getMySubscription();
      return SubscriptionSession(isActive: mySub.isActive, subscription: mySub.subscription);
    } on ApiException {
      // Fail OPEN, not closed: the real enforcement is server-side (every
      // business route still 402s if the subscription is actually
      // inactive, which flips this via onSubscriptionRequired above). This
      // client-side flag is only a UX convenience redirect, so a transient
      // network error on just this status fetch shouldn't hard-lock out a
      // user whose subscription may well still be active. If we already
      // know something (e.g. the backend-verified purchase result), keep it
      // rather than replacing it with "no subscription".
      return fallback ?? const SubscriptionSession(isActive: true);
    }
  }

  /// Re-reads the subscription from the backend (the source of truth). The
  /// last known state stays visible while loading ([AsyncLoading] carries the
  /// previous value) so the screen never flashes a wrong "no subscription" /
  /// "ended" message mid-refresh.
  Future<void> refresh() async {
    final previous = state.valueOrNull;
    state = const AsyncLoading<SubscriptionSession>().copyWithPrevious(state);
    state = AsyncData(await _fetch(fallback: previous));
  }

  /// A purchase/restore was just verified by the backend, which returned the
  /// now-active subscription: show it immediately (instead of the stale
  /// pre-purchase state), then reconcile with a fresh read.
  Future<void> activated(Subscription verified) async {
    state = AsyncData(SubscriptionSession(isActive: true, subscription: verified));
    await refresh();
  }
}

final subscriptionControllerProvider =
    AsyncNotifierProvider<SubscriptionController, SubscriptionSession>(SubscriptionController.new);
