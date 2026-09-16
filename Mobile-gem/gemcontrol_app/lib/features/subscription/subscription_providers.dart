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
  Future<SubscriptionSession> build() async {
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
      // user whose subscription may well still be active.
      return const SubscriptionSession(isActive: true);
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }
}

final subscriptionControllerProvider =
    AsyncNotifierProvider<SubscriptionController, SubscriptionSession>(SubscriptionController.new);
