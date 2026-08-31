import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/user.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/status_chip.dart';

final allUsersProvider = FutureProvider.autoDispose<List<AppUser>>((ref) {
  return ref.watch(authRepositoryProvider).getAllUsers();
});

class UsersScreen extends ConsumerWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(allUsersProvider);
    return Scaffold(
      appBar: GcAppBar(title: 'User Management'),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          builder: (_) => const _AddUserSheet(),
        ),
        child: const Icon(Icons.person_add_alt_1_outlined),
      ),
      body: AsyncValueWidget<List<AppUser>>(
        value: usersAsync,
        onRetry: () => ref.invalidate(allUsersProvider),
        isEmpty: (d) => d.isEmpty,
        emptyWidget: const EmptyState(icon: Icons.people_outline, message: 'No users yet.'),
        data: (users) => ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: users.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final u = users[i];
            return Card(
              child: ListTile(
                title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('${u.email}\n${u.contact}'),
                isThreeLine: true,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    StatusChip(label: u.role),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: AppColors.error),
                      onPressed: () async {
                        await ref.read(authRepositoryProvider).removeUser(u.id);
                        ref.invalidate(allUsersProvider);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _AddUserSheet extends ConsumerStatefulWidget {
  const _AddUserSheet();
  @override
  ConsumerState<_AddUserSheet> createState() => _AddUserSheetState();
}

class _AddUserSheetState extends ConsumerState<_AddUserSheet> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _role = 'staff';
  bool _saving = false;

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty || _emailCtrl.text.trim().isEmpty || _passwordCtrl.text.isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref.read(authRepositoryProvider).register(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            contact: _contactCtrl.text.trim(),
            password: _passwordCtrl.text,
            role: _role,
          );
      ref.invalidate(allUsersProvider);
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.lg,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('New User', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.md),
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _contactCtrl,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Contact'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _passwordCtrl,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<String>(
            initialValue: _role,
            decoration: const InputDecoration(labelText: 'Role'),
            items: const [
              DropdownMenuItem(value: 'staff', child: Text('Staff')),
              DropdownMenuItem(value: 'admin', child: Text('Admin')),
            ],
            onChanged: (v) => setState(() => _role = v!),
          ),
          const SizedBox(height: AppSpacing.md),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Create User'),
          ),
        ],
      ),
    );
  }
}
