import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_state.dart';
import '../../core/theme/app_theme.dart';

class _DrawerEntry {
  final String label;
  final IconData icon;
  final String path;
  final bool adminOnly;
  const _DrawerEntry(this.label, this.icon, this.path, {this.adminOnly = false});
}

const _entries = [
  _DrawerEntry('Dashboard', Icons.dashboard_outlined, '/home'),
  _DrawerEntry('Stock Management', Icons.inventory_2_outlined, '/inventory'),
  _DrawerEntry('Categories', Icons.category_outlined, '/inventory/categories'),
  _DrawerEntry('Raw Materials', Icons.diamond_outlined, '/inventory/raw-materials'),
  _DrawerEntry('Sales History', Icons.receipt_long_outlined, '/sales'),
  _DrawerEntry('Customers', Icons.people_outline, '/customers'),
  _DrawerEntry('Jewellery Panel', Icons.grid_view_outlined, '/reports/jewellery-panel'),
  _DrawerEntry('Girvi Panel', Icons.workspace_premium_outlined, '/reports/girvi', adminOnly: true),
  _DrawerEntry('Day Book', Icons.menu_book_outlined, '/reports/daybook'),
  _DrawerEntry('Payments Ledger', Icons.payments_outlined, '/reports/payments'),
  _DrawerEntry('Udhar Management', Icons.credit_score_outlined, '/reports/udhar'),
  _DrawerEntry('Firm Management', Icons.storefront_outlined, '/settings/firm', adminOnly: true),
  _DrawerEntry(
    'User Management',
    Icons.admin_panel_settings_outlined,
    '/settings/users',
    adminOnly: true,
  ),
];

/// The app's only navigation surface — there is no bottom nav bar. Every
/// destination (former tabs and former "Reports" hub items alike) lives here,
/// mirroring the website's permanent sidebar.
class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdmin = ref.watch(authControllerProvider).valueOrNull?.isAdmin ?? false;
    final currentPath = GoRouterState.of(context).matchedLocation;
    final visible = _entries.where((e) => !e.adminOnly || isAdmin).toList();

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              color: AppColors.primary,
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.md,
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset(
                      'assets/images/logo.png',
                      width: 40,
                      height: 40,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Gem Control',
                    style: TextStyle(
                      color: AppColors.onPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  for (final e in visible)
                    ListTile(
                      leading: Icon(
                        e.icon,
                        color: e.path == currentPath ? AppColors.primary : AppColors.onSurfaceVariant,
                      ),
                      title: Text(
                        e.label,
                        style: TextStyle(
                          fontWeight: e.path == currentPath ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                      selected: e.path == currentPath,
                      selectedTileColor: AppColors.primaryContainer.withValues(alpha: 0.2),
                      onTap: () {
                        Navigator.pop(context);
                        if (e.path != currentPath) context.go(e.path);
                      },
                    ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.settings_outlined, color: AppColors.onSurfaceVariant),
              title: const Text('Settings'),
              selected: currentPath == '/settings',
              onTap: () {
                Navigator.pop(context);
                if (currentPath != '/settings') context.go('/settings');
              },
            ),
          ],
        ),
      ),
    );
  }
}
