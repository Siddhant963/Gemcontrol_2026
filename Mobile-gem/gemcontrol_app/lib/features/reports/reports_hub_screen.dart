import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_state.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/gc_app_bar.dart';

class _ReportEntry {
  final String title;
  final String subtitle;
  final IconData icon;
  final String path;
  final bool adminOnly;
  const _ReportEntry(this.title, this.subtitle, this.icon, this.path, {this.adminOnly = false});
}

const _entries = [
  _ReportEntry('Day Book', "Today's full ledger of activity", Icons.menu_book_outlined, '/reports/daybook'),
  _ReportEntry('Payments Ledger', 'All payments received', Icons.payments_outlined, '/reports/payments'),
  _ReportEntry('Udhar Management', 'Outstanding credit & settlements', Icons.credit_score_outlined, '/reports/udhar'),
  _ReportEntry('Girvi Management', 'Pledged items & interest', Icons.diamond_outlined, '/reports/girvi', adminOnly: true),
  _ReportEntry('Jewellery Panel', 'Catalog-style browsing', Icons.grid_view_outlined, '/reports/jewellery-panel'),
];

class ReportsHubScreen extends ConsumerWidget {
  const ReportsHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdmin = ref.watch(authControllerProvider).valueOrNull?.isAdmin ?? false;
    final visible = _entries.where((e) => !e.adminOnly || isAdmin).toList();

    return Scaffold(
      appBar: GcAppBar(title: 'Reports'),
      body: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: visible.length,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (context, i) {
          final e = visible[i];
          return Card(
            child: ListTile(
              leading: Icon(e.icon, color: AppColors.primary),
              title: Text(e.title, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(e.subtitle),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push(e.path),
            ),
          );
        },
      ),
    );
  }
}
