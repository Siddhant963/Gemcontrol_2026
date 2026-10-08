import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/user.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/status_chip.dart';
import '../../shared/forms/live_validation.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/app_toast.dart';
import '../../shared/widgets/form_error_banner.dart';
import '../subscription/subscription_providers.dart';

final allUsersProvider = FutureProvider.autoDispose<List<AppUser>>((ref) {
  return ref.watch(authRepositoryProvider).getAllUsers();
});

class UsersScreen extends ConsumerWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(allUsersProvider);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'User Management'),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // The plan's staff-account limit (Basic: 3). The server enforces it;
          // this just explains it up front instead of failing on submit.
          final ent = ref.read(subscriptionControllerProvider).valueOrNull?.entitlements;
          if (ent != null && ent.staffLimitReached) {
            AppToast.show(
              context,
              'Your plan allows up to ${ent.staffLimit} staff accounts (${ent.staffUsed} in use). Upgrade to Pro for unlimited staff.',
              type: AppToastType.warning,
            );
            return;
          }
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (_) => const AddUserSheet(),
          );
        },
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
                      icon: Icon(Icons.delete_outline, color: scheme.error),
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

class AddUserSheet extends ConsumerStatefulWidget {
  const AddUserSheet({super.key});
  @override
  ConsumerState<AddUserSheet> createState() => _AddUserSheetState();
}

class _AddUserSheetState extends ConsumerState<AddUserSheet> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _role = 'staff';
  bool _saving = false;
  bool _obscure = true;

  static const _order = ['name', 'email', 'contact', 'password'];

  late final LiveValidation _v = LiveValidation(_rules, () {
    if (mounted) setState(() {});
  });

  Map<String, String> _rules() => errorsOf({
    'name': nameRule(_nameCtrl.text, label: 'Name'),
    'email': emailRule(_emailCtrl.text),
    'contact': phoneRule(_contactCtrl.text, label: 'Contact'),
    'password': passwordRule(_passwordCtrl.text),
  });

  String? _fieldForServerMessage(String message) {
    final m = message.toLowerCase();
    if (m.contains('already exists') || m.contains('email')) return 'email';
    if (m.contains('contact') || m.contains('10 digits')) return 'contact';
    if (m.contains('password')) return 'password';
    if (m.contains('name')) return 'name';
    return null;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _contactCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_v.validateAll()) {
      AppToast.show(context, 'Please fix the highlighted fields.', type: AppToastType.warning);
      _v.scrollToFirstError(_order);
      return;
    }
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
      if (mounted) {
        AppToast.show(context, 'User created.', type: AppToastType.success);
        Navigator.pop(context);
      }
    } catch (e) {
      // includes the plan's staff-account limit message (shown in the form)
      if (mounted) {
        final message = _v.describeError(e, fieldFor: _fieldForServerMessage);
        AppToast.show(context, message, type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
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
          FormErrorBanner(_v.formError),
          _v.wrap(
            'name',
            TextField(
              key: _v.keyFor('name'),
              controller: _nameCtrl,
              textCapitalization: TextCapitalization.words,
              inputFormatters: lengthLimit(kNameMax),
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(labelText: 'Name', errorText: _v.errorFor('name')),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _v.wrap(
            'email',
            TextField(
              key: _v.keyFor('email'),
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              inputFormatters: lengthLimit(kEmailMax),
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(labelText: 'Email', errorText: _v.errorFor('email')),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _v.wrap(
            'contact',
            TextField(
              key: _v.keyFor('contact'),
              controller: _contactCtrl,
              keyboardType: TextInputType.phone,
              inputFormatters: phoneFormatters,
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(
                labelText: 'Contact',
                helperText: '10 digit mobile number',
                errorText: _v.errorFor('contact'),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _v.wrap(
            'password',
            TextField(
              key: _v.keyFor('password'),
              controller: _passwordCtrl,
              obscureText: _obscure,
              inputFormatters: lengthLimit(kPasswordMax),
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(
                labelText: 'Password',
                helperText: 'At least $kPasswordMin characters',
                errorText: _v.errorFor('password'),
                suffixIcon: IconButton(
                  tooltip: _obscure ? 'Show password' : 'Hide password',
                  icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
            ),
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
