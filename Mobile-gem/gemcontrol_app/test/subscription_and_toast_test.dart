import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gemcontrol_app/core/api/api_client.dart';
import 'package:gemcontrol_app/core/auth/auth_state.dart';
import 'package:gemcontrol_app/core/models/subscription.dart';
import 'package:gemcontrol_app/core/repositories/subscription_repository.dart';
import 'package:gemcontrol_app/features/subscription/subscription_presentation.dart';
import 'package:gemcontrol_app/features/subscription/subscription_providers.dart';
import 'package:gemcontrol_app/shared/forms/live_validation.dart';
import 'package:gemcontrol_app/shared/widgets/app_toast.dart';

final _basic = SubscriptionPlan(
  id: 'pl1', key: 'basic', name: 'Basic', price: 14999, billingInterval: 'year', maxStaff: 5, features: const [],
);
final _pro = SubscriptionPlan(
  id: 'pl2', key: 'pro', name: 'Pro', price: 29999, billingInterval: 'year', maxStaff: 50, features: const [],
);

Subscription _sub(String status, SubscriptionPlan plan, {int endInDays = 365, String provider = 'razorpay'}) =>
    Subscription(
      id: 's1',
      status: status,
      startDate: DateTime.now(),
      endDate: DateTime.now().add(Duration(days: endInDays)),
      paymentProvider: provider,
      plan: plan,
    );

class _FakeAuth extends AuthController {
  @override
  Future<AuthSession> build() async => const AuthSession(isLoggedIn: true, role: 'admin');
}

class _FakeRepo implements SubscriptionRepository {
  MySubscription Function() onGet;
  Completer<void>? gate;
  _FakeRepo(this.onGet);

  @override
  Future<MySubscription> getMySubscription() async {
    if (gate != null) await gate!.future;
    return onGet();
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

ProviderContainer _container(_FakeRepo repo) {
  final c = ProviderContainer(overrides: [
    authControllerProvider.overrideWith(_FakeAuth.new),
    subscriptionRepositoryProvider.overrideWithValue(repo),
  ]);
  addTearDown(c.dispose);
  return c;
}

void main() {
  group('SubscriptionPresentation (backend state -> UI)', () {
    test('CASE none: no subscription row', () {
      final p = SubscriptionPresentation.from(SubscriptionSession.inactive);
      expect(p.phase, SubscriptionPhase.none);
      expect(p.actionLabel('pl1'), 'Subscribe');
    });

    test('trial is a trial, never "current plan", no ended warning', () {
      final p = SubscriptionPresentation.from(
        SubscriptionSession(isActive: true, subscription: _sub('trialing', _basic, endInDays: 9)),
      );
      expect(p.phase, SubscriptionPhase.trial);
      expect(p.message, contains('9 day(s) left'));
      expect(p.isCurrentPlan('pl1'), false);
      expect(p.actionLabel('pl1'), 'Subscribe');
    });

    test('CASE 1/2/8: ACTIVE Basic / Pro shows active, no expiry/renewal warning', () {
      for (final plan in [_basic, _pro]) {
        final p = SubscriptionPresentation.from(
          SubscriptionSession(isActive: true, subscription: _sub('active', plan)),
        );
        expect(p.phase, SubscriptionPhase.active);
        expect(p.bannerKind, SubscriptionBannerKind.success);
        expect(p.message, contains('${plan.name} plan'));
        expect(p.message, contains('active until'));
        expect(p.message, isNot(contains('ended')));
        expect(p.isCurrentPlan(plan.id), true);
        final other = plan.id == 'pl1' ? 'pl2' : 'pl1';
        expect(p.isCurrentPlan(other), false);
        expect(p.actionLabel(other), 'Switch plan');
      }
    });

    test('CASE 9: actually expired still warns, every plan renewable', () {
      final p = SubscriptionPresentation.from(
        SubscriptionSession(isActive: false, subscription: _sub('expired', _pro, endInDays: -3)),
      );
      expect(p.phase, SubscriptionPhase.ended);
      expect(p.bannerKind, SubscriptionBannerKind.warning);
      expect(p.message, contains('has ended'));
      expect(p.isCurrentPlan('pl2'), false); // the ended plan must be re-buyable
      expect(p.actionLabel('pl1'), 'Renew');
      expect(p.actionLabel('pl2'), 'Renew');
    });

    test('cancelled/ended copy distinguishes cancelled', () {
      final p = SubscriptionPresentation.from(
        SubscriptionSession(isActive: false, subscription: _sub('cancelled', _pro, endInDays: -1)),
      );
      expect(p.message, contains('was cancelled'));
    });

    test('CASE 10: cancelled-with-time-left is just ACTIVE until expiry (backend has no auto-renew flag)', () {
      final p = SubscriptionPresentation.from(
        SubscriptionSession(isActive: true, subscription: _sub('active', _pro, endInDays: 12, provider: 'apple_iap')),
      );
      expect(p.phase, SubscriptionPhase.active);
      expect(p.message, contains('active until'));
      expect(p.message, isNot(contains('Renews')));
      expect(p.message, isNot(contains('ended')));
    });

    test('backend isActive wins over a stale "active" status string', () {
      final p = SubscriptionPresentation.from(
        SubscriptionSession(isActive: false, subscription: _sub('active', _pro, endInDays: -1)),
      );
      expect(p.phase, SubscriptionPhase.ended);
    });
  });

  group('SubscriptionController (refresh / purchase / restore)', () {
    test('CASE 6/7: verified purchase or restore shows ACTIVE immediately, then reconciles', () async {
      MySubscription current = MySubscription(subscription: null, isActive: false);
      final repo = _FakeRepo(() => current);
      final c = _container(repo);
      await c.read(subscriptionControllerProvider.future);
      expect(SubscriptionPresentation.from(c.read(subscriptionControllerProvider).valueOrNull).phase, SubscriptionPhase.none);

      final verified = _sub('active', _pro);
      current = MySubscription(subscription: verified, isActive: true);
      repo.gate = Completer<void>(); // hold the refresh so we can observe the in-between state
      final pending = c.read(subscriptionControllerProvider.notifier).activated(verified);
      await Future<void>.delayed(Duration.zero);
      final mid = c.read(subscriptionControllerProvider);
      expect(mid.isLoading, true, reason: 'refresh in flight');
      expect(SubscriptionPresentation.from(mid.valueOrNull).phase, SubscriptionPhase.active,
          reason: 'never falls back to a stale/none/ended state while refreshing');
      repo.gate!.complete();
      await pending;
      final done = SubscriptionPresentation.from(c.read(subscriptionControllerProvider).valueOrNull);
      expect(done.phase, SubscriptionPhase.active);
      expect(done.planName, 'Pro');
    });

    test('refresh keeps the last known state visible while loading (no wrong flash)', () async {
      final repo = _FakeRepo(() => MySubscription(subscription: _sub('active', _basic), isActive: true));
      final c = _container(repo);
      await c.read(subscriptionControllerProvider.future);
      repo.gate = Completer<void>();
      final f = c.read(subscriptionControllerProvider.notifier).refresh();
      await Future<void>.delayed(Duration.zero);
      final s = c.read(subscriptionControllerProvider);
      expect(s.isLoading, true);
      expect(s.valueOrNull?.subscription?.plan?.name, 'Basic');
      repo.gate!.complete();
      await f;
    });

    test('backend refresh fails right after a verified purchase -> keeps the verified ACTIVE state', () async {
      var failing = false;
      final repo = _FakeRepo(() {
        if (failing) throw ApiException('network down');
        return MySubscription(subscription: null, isActive: false);
      });
      final c = _container(repo);
      await c.read(subscriptionControllerProvider.future);
      failing = true;
      await c.read(subscriptionControllerProvider.notifier).activated(_sub('active', _pro));
      final p = SubscriptionPresentation.from(c.read(subscriptionControllerProvider).valueOrNull);
      expect(p.phase, SubscriptionPhase.active);
      expect(p.planName, 'Pro');
    });

    test('very first load failing still fails OPEN (unchanged behaviour)', () async {
      final repo = _FakeRepo(() => throw ApiException('offline'));
      final c = _container(repo);
      final s = await c.read(subscriptionControllerProvider.future);
      expect(s.isActive, true);
      expect(s.subscription, isNull);
    });

    test('CASE 3: leaving the screen and coming back re-reads the backend state', () async {
      var current = MySubscription(subscription: _sub('expired', _pro, endInDays: -2), isActive: false);
      final repo = _FakeRepo(() => current);
      final c = _container(repo);
      await c.read(subscriptionControllerProvider.future);
      current = MySubscription(subscription: _sub('active', _basic), isActive: true);
      await c.read(subscriptionControllerProvider.notifier).refresh();
      final p = SubscriptionPresentation.from(c.read(subscriptionControllerProvider).valueOrNull);
      expect(p.phase, SubscriptionPhase.active);
      expect(p.planName, 'Basic');
    });
  });

  group('LiveValidation', () {
    late Map<String, String> rules;
    late int rebuilds;
    late LiveValidation v;
    setUp(() {
      rebuilds = 0;
      rules = {'name': 'Item name is required', 'price': 'Enter a price greater than 0'};
      v = LiveValidation(() => Map.of(rules), () => rebuilds++);
    });

    test('nothing is shown for untouched fields', () {
      expect(v.errorFor('name'), isNull);
      expect(v.errorFor('price'), isNull);
      v.changed();
      expect(v.errorFor('name'), isNull);
    });

    test('blur shows that field only; clears live once valid', () {
      v.blur('name');
      expect(v.errorFor('name'), 'Item name is required');
      expect(v.errorFor('price'), isNull);
      rules.remove('name');
      v.changed();
      expect(v.errorFor('name'), isNull);
    });

    test('submit shows every error at once', () {
      expect(v.validateAll(), false);
      expect(v.errorFor('name'), isNotNull);
      expect(v.errorFor('price'), isNotNull);
      rules.clear();
      expect(v.validateAll(), true);
      expect(v.errorFor('name'), isNull);
    });

    test('cross-field rule re-checks when the other field changes', () {
      rules = {'gross': 'Enter a gross weight greater than the less weight'};
      v.blur('gross');
      expect(v.errorFor('gross'), isNotNull);
      rules = {};
      v.changed();
      expect(v.errorFor('gross'), isNull);
    });

    test('server error is placed on the field and cleared by a valid edit', () {
      rules = {};
      v.setServerError('name', 'Material with this name already exists');
      expect(v.errorFor('name'), 'Material with this name already exists');
      v.changed();
      expect(v.errorFor('name'), isNull);
    });
  });

  group('AppToast', () {
    Future<void> pumpApp(WidgetTester tester, Size size, {double topInset = 0}) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MediaQuery(
          data: MediaQueryData(size: size, padding: EdgeInsets.only(top: topInset)),
          child: MaterialApp(
            home: Scaffold(
              appBar: AppBar(title: const Text('Home')),
              body: Builder(
                builder: (context) => Center(
                  child: ElevatedButton(
                    onPressed: () => showModalBottomSheet<void>(
                      context: context,
                      builder: (_) => SizedBox(
                        height: size.height * 0.6,
                        child: Builder(
                          builder: (sheetCtx) => Center(
                            child: ElevatedButton(
                              onPressed: () => AppToast.show(
                                sheetCtx,
                                'Item could not be created because this SKU already exists in your inventory for the selected firm.',
                                type: AppToastType.error,
                              ),
                              child: const Text('toast-in-sheet'),
                            ),
                          ),
                        ),
                      ),
                    ),
                    child: const Text('open-sheet'),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    for (final size in const [Size(320, 568), Size(390, 844), Size(430, 932), Size(768, 1024)]) {
      testWidgets('top, inside the screen, above a modal sheet, wraps long text @${size.width.toInt()}', (tester) async {
        await pumpApp(tester, size);
        await tester.tap(find.text('open-sheet'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('toast-in-sheet'));
        await tester.pump(const Duration(milliseconds: 300));
        final toast = find.textContaining('SKU already exists');
        expect(toast, findsOneWidget);
        final rect = tester.getRect(toast);
        expect(rect.top, lessThan(120), reason: 'at the TOP, not the bottom');
        expect(rect.left, greaterThanOrEqualTo(0));
        expect(rect.right, lessThanOrEqualTo(size.width));
        expect(rect.height, greaterThan(20), reason: 'long message wraps onto more lines');
        expect(tester.takeException(), isNull, reason: 'no overflow');
        // hit-testable above the sheet: the dismiss button is tappable
        await tester.tap(find.byTooltip('Dismiss'));
        await tester.pump(const Duration(milliseconds: 300));
        expect(toast, findsNothing, reason: 'manual dismiss works');
      });
    }

    testWidgets('respects the status-bar / notch inset (SafeArea)', (tester) async {
      await pumpApp(tester, const Size(390, 844), topInset: 47);
      await tester.tap(find.text('open-sheet'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('toast-in-sheet'));
      await tester.pump(const Duration(milliseconds: 300));
      final rect = tester.getRect(find.textContaining('SKU already exists'));
      expect(rect.top, greaterThanOrEqualTo(47), reason: 'never under the notch');
      await tester.pump(const Duration(seconds: 6)); // let the auto-dismiss timer finish
    });

    testWidgets('auto-dismisses and only one toast shows at a time', (tester) async {
      await pumpApp(tester, const Size(390, 844));
      await tester.tap(find.text('open-sheet'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('toast-in-sheet'));
      await tester.pump();
      await tester.tap(find.text('toast-in-sheet'), warnIfMissed: false);
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.textContaining('SKU already exists'), findsOneWidget);
      await tester.pump(const Duration(seconds: 6));
      expect(find.textContaining('SKU already exists'), findsNothing);
    });

    for (final type in AppToastType.values) {
      testWidgets('all four types render at the top: ${type.name}', (tester) async {
        await tester.pumpWidget(MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => TextButton(
                onPressed: () => AppToast.show(context, 'A ${type.name} message', type: type),
                child: const Text('go'),
              ),
            ),
          ),
        ));
        await tester.tap(find.text('go'));
        await tester.pump(const Duration(milliseconds: 300));
        final rect = tester.getRect(find.text('A ${type.name} message'));
        expect(rect.top, lessThan(100));
        await tester.pump(const Duration(seconds: 6));
      });
    }
  });
}
