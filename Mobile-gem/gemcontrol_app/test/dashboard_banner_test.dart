import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gemcontrol_app/core/auth/auth_state.dart';
import 'package:gemcontrol_app/core/models/activity.dart';
import 'package:gemcontrol_app/core/repositories/dashboard_repository.dart';
import 'package:gemcontrol_app/core/theme/app_theme.dart';
import 'package:gemcontrol_app/features/dashboard/dashboard_screen.dart';
import 'package:gemcontrol_app/shared/widgets/brand_banner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FakeAuth extends AuthController {
  @override
  Future<AuthSession> build() async => const AuthSession(isLoggedIn: true, role: 'admin');
}

class _FakeDashboardRepo implements DashboardRepository {
  final bool fail;
  _FakeDashboardRepo({this.fail = false});

  @override
  Future<DashboardData> getDashboardData() async {
    if (fail) throw Exception('offline');
    return DashboardData(
      totalCustomers: 1,
      totalSales: 80000,
      totalSalesCount: 2,
      totalStockValue: 12000,
      totalRawMaterialWeight: 10,
    );
  }

  @override
  Future<List<MonthlySales>> getMonthlySales() async {
    if (fail) throw Exception('offline');
    return [MonthlySales(month: 'September', year: 2026, totalRevenue: 80000)];
  }

  @override
  Future<List<ActivityItem>> getRecentActivities() async => const [];

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

/// Runs [body] in an error zone that ignores ONLY google_fonts' failed font
/// downloads (they can never succeed inside a widget test and are raised
/// asynchronously, sometimes after the test body has ended). Any other error,
/// including a failed expect(), is rethrown so the test still fails.
Future<void> guardFonts(Future<void> Function() body) async {
  Object? real;
  StackTrace? realTrace;
  await runZonedGuarded<Future<void>>(() async {
    try {
      await body();
    } catch (e, st) {
      real = e;
      realTrace = st;
    }
  }, (e, st) {
    if (!e.toString().contains('Failed to load font')) {
      real ??= e;
      realTrace ??= st;
    }
  });
  if (real != null) Error.throwWithStackTrace(real!, realTrace!);
}

void fontSafeTestWidgets(String name, Future<void> Function(WidgetTester tester) body) =>
    testWidgets(name, (tester) => guardFonts(() => body(tester)));

/// google_fonts tries to download fonts from the network, which always fails
/// (HTTP 400) inside widget tests. That is a test-environment artefact, so it
/// is ignored -- any OTHER exception still fails the test.
void expectNoRealErrors(WidgetTester tester) {
  Object? e;
  while ((e = tester.takeException()) != null) {
    if (!e.toString().contains('Failed to load font')) {
      fail('Unexpected exception: $e');
    }
  }
}

/// Pump, then give google_fonts' failing (in tests) downloads real time to
/// finish, so they are raised -- and drained -- inside the test.
Future<void> settle(WidgetTester tester) async {
  await tester.pump(const Duration(milliseconds: 300));
  await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
  await tester.pump(const Duration(milliseconds: 300));
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  Future<GlobalKey> pumpDashboard(WidgetTester tester, Size size, {bool fail = false}) async {
    tester.view.physicalSize = size * 2;
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final shot = GlobalKey();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_FakeAuth.new),
          dashboardRepositoryProvider.overrideWithValue(_FakeDashboardRepo(fail: fail)),
        ],
        child: RepaintBoundary(
          key: shot,
          child: MaterialApp(theme: AppTheme.dark(), home: const DashboardScreen()),
        ),
      ),
    );
    // decode the real banner asset before the first frames settle
    await tester.runAsync(() async {
      final ctx = tester.element(find.byType(DashboardScreen));
      await precacheImage(const AssetImage(BrandBanner.assetPath), ctx);
    });
    // let google_fonts' (always failing, in tests) download attempts finish
    // INSIDE the test so they are drained by expectNoRealErrors, not reported
    // after the test completes.
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 500)));
    await settle(tester);
    await settle(tester);
    return shot;
  }

  Future<void> teardown(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink()); // dispose providers/timers
    await tester.pump(const Duration(milliseconds: 50));
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
    expectNoRealErrors(tester); // drain the ignorable font-download errors
  }

  for (final size in const [Size(320, 640), Size(390, 844), Size(430, 932), Size(768, 1024)]) {
    fontSafeTestWidgets('banner sits below the charts, keeps its aspect ratio, no overflow @${size.width.toInt()}', (tester) async {
      await pumpDashboard(tester, size);
      await tester.scrollUntilVisible(find.byType(BrandBanner), 200, scrollable: find.byType(Scrollable).first);
      await settle(tester);

      final banner = tester.getRect(find.byType(BrandBanner));
      expect(banner.left, 16, reason: 'same side padding as the cards');
      expect(banner.width, closeTo(size.width - 32, 0.5), reason: 'full content width');
      expect(banner.width / banner.height, closeTo(2048 / 768, 0.01), reason: 'image aspect ratio kept (no stretch/crop)');
      expect(find.byType(Image), findsWidgets);

      final charts = tester.getRect(find.text('Monthly Revenue'));
      expect(banner.top, greaterThan(charts.bottom), reason: 'banner is BELOW the revenue section');
      expectNoRealErrors(tester);
      await teardown(tester);
    });
  }

  fontSafeTestWidgets('banner still shows when the dashboard data fails to load', (tester) async {
    await pumpDashboard(tester, const Size(390, 844), fail: true);
    await tester.scrollUntilVisible(find.byType(BrandBanner), 200, scrollable: find.byType(Scrollable).first);
    await settle(tester);
    expect(find.byType(BrandBanner), findsOneWidget);
    expectNoRealErrors(tester);
    await teardown(tester);
  });

  fontSafeTestWidgets('a missing banner file renders nothing instead of breaking the screen', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: DefaultAssetBundle(bundle: _BundleWithoutBanner(), child: const BrandBanner()),
      ),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.byType(BrandBanner), findsOneWidget);
    expectNoRealErrors(tester);
  });

  fontSafeTestWidgets('screenshot of the dashboard with the banner (390x844) for visual review', (tester) async {
    final shot = await pumpDashboard(tester, const Size(390, 844));
    await tester.scrollUntilVisible(find.byType(BrandBanner), 200, scrollable: find.byType(Scrollable).first);
    await settle(tester);
    final out = Platform.environment['DASHBOARD_SHOT'];
    if (out != null) {
      await tester.runAsync(() async {
        final boundary = shot.currentContext!.findRenderObject()! as RenderRepaintBoundary;
        final image = await boundary.toImage(pixelRatio: 1);
        final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
        await File(out).writeAsBytes(bytes!.buffer.asUint8List());
      });
    }
    await teardown(tester);
  });
}

/// Loads every asset normally EXCEPT the banner image, to prove BrandBanner
/// degrades quietly when that one file is missing.
class _BundleWithoutBanner extends CachingAssetBundle {
  @override
  Future<ByteData> load(String key) {
    if (key.contains('ratnsetu_banner')) {
      return Future<ByteData>.error(FlutterError('no such asset: $key'));
    }
    return rootBundle.load(key);
  }
}
