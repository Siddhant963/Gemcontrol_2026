import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/categories/categories_screen.dart';
import '../../features/customers/customers_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/daybook/daybook_screen.dart';
import '../../features/firm/firm_screen.dart';
import '../../features/girvi/girvi_screen.dart';
import '../../features/invoice/invoice_screen.dart';
import '../../features/jewellery_panel/jewellery_panel_screen.dart';
import '../../features/login/login_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/payments/payments_screen.dart';
import '../../features/raw_materials/raw_materials_screen.dart';
import '../../features/sales_history/sales_history_screen.dart';
import '../../features/sales_pos/new_sale_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/stock/stock_screen.dart';
import '../../features/udhar/udhar_screen.dart';
import '../../features/users/users_screen.dart';
import '../models/sale.dart';
import '../auth/auth_state.dart';

const _adminOnlyPaths = ['/reports/girvi', '/settings/firm', '/settings/users'];

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefreshNotifier(ref);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final authAsync = ref.read(authControllerProvider);
      final loc = state.matchedLocation;

      // Still hydrating from secure storage — stay on the splash screen.
      if (authAsync.isLoading) return loc == '/' ? null : '/';

      final session = authAsync.valueOrNull ?? AuthSession.loggedOut;

      if (!session.isLoggedIn) {
        return loc == '/login' ? null : '/login';
      }
      if (loc == '/' || loc == '/login') return '/home';
      if (_adminOnlyPaths.contains(loc) && !session.isAdmin) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/home', builder: (context, state) => const DashboardScreen()),
      GoRoute(path: '/inventory', builder: (context, state) => const StockScreen()),
      GoRoute(
        path: '/inventory/categories',
        builder: (context, state) => const CategoriesScreen(),
      ),
      GoRoute(
        path: '/inventory/raw-materials',
        builder: (context, state) => const RawMaterialsScreen(),
      ),
      GoRoute(path: '/sales', builder: (context, state) => const SalesHistoryScreen()),
      GoRoute(path: '/sales/new', builder: (context, state) => const NewSaleScreen()),
      GoRoute(
        path: '/sales/:id',
        builder: (context, state) {
          final sale = state.extra as Sale?;
          if (sale == null) {
            return const Scaffold(body: Center(child: Text('Invoice not available')));
          }
          return InvoiceScreen(sale: sale);
        },
      ),
      GoRoute(path: '/customers', builder: (context, state) => const CustomersScreen()),
      GoRoute(path: '/reports/daybook', builder: (context, state) => const DayBookScreen()),
      GoRoute(path: '/reports/payments', builder: (context, state) => const PaymentsScreen()),
      GoRoute(path: '/reports/udhar', builder: (context, state) => const UdharScreen()),
      GoRoute(path: '/reports/girvi', builder: (context, state) => const GirviScreen()),
      GoRoute(
        path: '/reports/jewellery-panel',
        builder: (context, state) => const JewelleryPanelScreen(),
      ),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/settings/firm', builder: (context, state) => const FirmScreen()),
      GoRoute(path: '/settings/users', builder: (context, state) => const UsersScreen()),
    ],
  );
});
