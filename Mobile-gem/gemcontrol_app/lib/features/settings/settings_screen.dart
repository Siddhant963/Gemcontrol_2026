import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/repositories/daily_rate_repository.dart';
import '../../core/repositories/export_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'daily_rate_sheet.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).valueOrNull;
    final isAdmin = session?.isAdmin ?? false;

    return Scaffold(
      appBar: GcAppBar(title: 'Settings'),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: AppColors.primaryContainer,
                child: Icon(Icons.person_outline, color: AppColors.primary),
              ),
              title: Text(isAdmin ? 'Admin' : 'Staff'),
              subtitle: const Text('Signed in to GemControl'),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          if (isAdmin) ...[
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.storefront_outlined, color: AppColors.primary),
                    title: const Text('Firm Management'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/settings/firm'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.people_outline, color: AppColors.primary),
                    title: const Text('User Management'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/settings/users'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.currency_exchange_outlined, color: AppColors.primary),
                    title: const Text("Today's Rate"),
                    subtitle: const Text('Set gold/silver/diamond rates'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      final today = await ref.read(dailyRateRepositoryProvider).getTodayRate();
                      if (context.mounted) {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (_) => DailyRateSheet(existing: today),
                        );
                      }
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.download_outlined, color: AppColors.primary),
                    title: const Text('Export All Data'),
                    subtitle: const Text('Download .xlsx of all business data'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      final messenger = ScaffoldMessenger.of(context);
                      messenger.showSnackBar(const SnackBar(content: Text('Preparing export...')));
                      try {
                        final file = await ref.read(exportRepositoryProvider).downloadExport();
                        messenger.showSnackBar(SnackBar(content: Text('Saved to ${file.path}')));
                      } on ApiException catch (e) {
                        messenger.showSnackBar(SnackBar(content: Text(e.message)));
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout, color: AppColors.error),
              title: const Text('Logout', style: TextStyle(color: AppColors.error)),
              onTap: () async {
                await ref.read(authControllerProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const Center(
            child: Text(
              'GemControl v1.0.0',
              style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
