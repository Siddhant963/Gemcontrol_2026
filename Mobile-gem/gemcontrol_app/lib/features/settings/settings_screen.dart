import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_state.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/repositories/daily_rate_repository.dart';
import '../../core/repositories/export_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_mode_provider.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../subscription/subscription_providers.dart';
import 'daily_rate_sheet.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).valueOrNull;
    final isAdmin = session?.isAdmin ?? false;
    final scheme = Theme.of(context).colorScheme;
    final themeMode = ref.watch(themeModeControllerProvider);
    final isDark = themeMode == ThemeMode.dark;
    final subAsync = ref.watch(subscriptionControllerProvider);
    final sub = subAsync.valueOrNull?.subscription;

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Settings'),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: scheme.primaryContainer,
                child: Icon(Icons.person_outline, color: scheme.onPrimaryContainer),
              ),
              title: Text(isAdmin ? 'Admin' : 'Staff'),
              subtitle: const Text('Signed in to RatnSetu'),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Card(
            child: SwitchListTile(
              secondary: Icon(
                isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                color: scheme.primary,
              ),
              title: const Text('Dark Mode'),
              subtitle: Text(isDark ? 'Obsidian & sovereign gold' : 'Alabaster & antique gold'),
              value: isDark,
              onChanged: (value) => ref
                  .read(themeModeControllerProvider.notifier)
                  .setMode(value ? ThemeMode.dark : ThemeMode.light),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          if (isAdmin) ...[
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.workspace_premium_outlined, color: scheme.primary),
                    title: const Text('Subscription'),
                    subtitle: Text(
                      sub == null
                          ? 'No subscription yet'
                          : '${sub.plan?.name ?? sub.status} · ${sub.status == 'trialing' ? 'Trial' : sub.status}',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/subscribe'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.storefront_outlined, color: scheme.primary),
                    title: const Text('Firm Management'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/settings/firm'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.people_outline, color: scheme.primary),
                    title: const Text('User Management'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/settings/users'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.currency_exchange_outlined, color: scheme.primary),
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
                    leading: Icon(Icons.download_outlined, color: scheme.primary),
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
              leading: Icon(Icons.logout, color: scheme.error),
              title: Text('Logout', style: TextStyle(color: scheme.error)),
              onTap: () async {
                await ref.read(authControllerProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          // Self-service account deletion -- required by App Store
          // guideline 5.1.1(v) (any app offering account creation must
          // also offer in-app deletion). See Backend/Controllers/
          // adminController.js's deleteMyAccount for the actual policy.
          Card(
            child: ListTile(
              leading: Icon(Icons.delete_forever_outlined, color: scheme.error),
              title: Text('Delete Account', style: TextStyle(color: scheme.error)),
              onTap: () => showDialog<void>(
                context: context,
                builder: (_) => _DeleteAccountDialog(isAdmin: isAdmin),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Center(
            child: Text(
              'RatnSetu v1.0.0',
              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

/// Password-confirmed "are you sure" for self-service account deletion --
/// see SettingsScreen's Delete Account tile above. Stateful only for the
/// password field / in-dialog error / submitting flag; the actual request
/// and post-success logout+navigation happen here so the dialog can stay
/// open on failure (e.g. wrong password) and close itself on success.
class _DeleteAccountDialog extends ConsumerStatefulWidget {
  final bool isAdmin;
  const _DeleteAccountDialog({required this.isAdmin});

  @override
  ConsumerState<_DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends ConsumerState<_DeleteAccountDialog> {
  final _passwordController = TextEditingController();
  String? _error;
  bool _submitting = false;

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final password = _passwordController.text;
    if (password.isEmpty) {
      setState(() => _error = 'Enter your password to confirm.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).deleteMyAccount(password);
      // The backend already cleared the session cookie/removed login
      // access server-side -- this just clears local token storage and
      // app state to match.
      await ref.read(authControllerProvider.notifier).logout();
      if (mounted) {
        Navigator.of(context).pop();
        context.go('/login');
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AlertDialog(
      title: Text('Delete your account?', style: TextStyle(color: scheme.error)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.isAdmin
                  ? 'This deactivates your account and every staff account under your '
                      'firm right away. This cannot be undone by you -- contact support '
                      'within 30 days if this was a mistake.'
                  : 'This deactivates your account right away. This cannot be undone by '
                      'you -- contact support within 30 days if this was a mistake.',
            ),
            if (widget.isAdmin) ...[
              const SizedBox(height: AppSpacing.sm),
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: scheme.errorContainer,
                  borderRadius: BorderRadius.circular(AppRadii.sm),
                ),
                child: Text(
                  "If you're subscribed via the App Store or Razorpay, deleting your "
                  'account here does NOT automatically stop future charges. Cancel your '
                  'subscription separately first.',
                  style: TextStyle(color: scheme.onErrorContainer, fontSize: 12),
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _passwordController,
              obscureText: true,
              autofocus: true,
              enabled: !_submitting,
              decoration: const InputDecoration(labelText: 'Confirm your password'),
              onSubmitted: (_) => _confirm(),
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(_error!, style: TextStyle(color: scheme.error, fontSize: 13)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _submitting ? null : _confirm,
          style: FilledButton.styleFrom(backgroundColor: scheme.error),
          child: Text(_submitting ? 'Deleting...' : 'Delete My Account'),
        ),
      ],
    );
  }
}
