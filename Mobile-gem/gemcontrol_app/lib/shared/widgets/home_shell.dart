import 'package:flutter/material.dart';

import '../../features/customers/customers_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/reports/reports_hub_screen.dart';
import '../../features/sales_history/sales_history_screen.dart';
import '../../features/stock/stock_screen.dart';
import 'app_shell.dart';

/// Root authenticated destination. Bottom-nav tab switching is local widget
/// state (an IndexedStack) rather than separate go_router routes — detail
/// screens (categories, new sale, invoice, reports, settings) are pushed on
/// top via go_router and get the system back button with no bottom nav,
/// which is the desired behavior for those.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _tabs = [
    DashboardScreen(),
    StockScreen(),
    SalesHistoryScreen(),
    CustomersScreen(),
    ReportsHubScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return AppShell(
      currentIndex: _index,
      onDestinationSelected: (i) => setState(() => _index = i),
      child: IndexedStack(index: _index, children: _tabs),
    );
  }
}
