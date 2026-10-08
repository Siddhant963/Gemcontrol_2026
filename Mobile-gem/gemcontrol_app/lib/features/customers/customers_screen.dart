import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/models/customer.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/customer_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'customers_providers.dart';
import '../../shared/forms/live_validation.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/app_toast.dart';
import '../../shared/widgets/form_error_banner.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final customersAsync = ref.watch(customersProvider);
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Customers', showAppActions: true),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
          ),
          builder: (_) => const AddCustomerSheet(),
        ),
        child: const Icon(Icons.person_add_alt_1_outlined),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: TextField(
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: const InputDecoration(
                hintText: 'Search customers...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: AsyncValueWidget<List<Customer>>(
              value: customersAsync,
              onRetry: () => ref.invalidate(customersProvider),
              data: (all) {
                final filtered = _query.isEmpty
                    ? all
                    : all
                        .where((c) =>
                            c.name.toLowerCase().contains(_query) ||
                            c.contact.toLowerCase().contains(_query))
                        .toList();
                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.people_outline,
                    message: 'No customers found.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md,
                    0,
                    AppSpacing.md,
                    AppSpacing.xl,
                  ),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, i) => _CustomerCard(customer: filtered[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CustomerCard extends ConsumerWidget {
  final Customer customer;
  const _CustomerCard({required this.customer});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 4),
        leading: CircleAvatar(
          backgroundColor: scheme.primaryContainer.withValues(alpha: 0.3),
          child: Text(
            customer.name.isNotEmpty ? customer.name[0].toUpperCase() : '?',
            style: TextStyle(color: scheme.primary, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(customer.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${customer.contact}\n${customer.address}'),
        isThreeLine: true,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(Icons.call_outlined, color: scheme.primary, size: 20),
              onPressed: () => launchUrl(Uri.parse('tel:${customer.contact}')),
            ),
            IconButton(
              icon: Icon(Icons.delete_outline, color: scheme.error, size: 20),
              onPressed: () => showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Delete customer?'),
                  content: Text('Remove "${customer.name}"?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await ref.read(customerRepositoryProvider).removeCustomer(customer.id);
                        ref.invalidate(customersProvider);
                      },
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AddCustomerSheet extends ConsumerStatefulWidget {
  const AddCustomerSheet({super.key});
  @override
  ConsumerState<AddCustomerSheet> createState() => _AddCustomerSheetState();
}

class _AddCustomerSheetState extends ConsumerState<AddCustomerSheet> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _saving = false;

  static const _order = ['name', 'contact', 'email', 'address'];

  // Errors show as the user leaves a box, all at once on Save, and clear the
  // moment the value is valid. The backend requires ALL four fields.
  late final LiveValidation _v = LiveValidation(_rules, () {
    if (mounted) setState(() {});
  });

  Map<String, String> _rules() => errorsOf({
    'name': nameRule(_nameCtrl.text, label: 'Name'),
    'contact': phoneRule(_contactCtrl.text),
    'email': emailRule(_emailCtrl.text),
    'address': textRule(_addressCtrl.text, 'Address', max: kAddressMax),
  });

  String? _fieldForServerMessage(String message) {
    final m = message.toLowerCase();
    if (m.contains('email')) return 'email';
    if (m.contains('contact') || m.contains('10 digits')) return 'contact';
    if (m.contains('name')) return 'name';
    return null;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _contactCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_v.validateAll()) {
      AppToast.show(context, 'Please fix the highlighted fields.', type: AppToastType.warning);
      _v.scrollToFirstError(_order);
      return;
    }
    final firm = ref.read(currentFirmProvider);
    if (firm == null) {
      AppToast.show(context, 'No firm found — set up a firm in Settings first', type: AppToastType.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(customerRepositoryProvider).addCustomer(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            contact: _contactCtrl.text.trim(),
            address: _addressCtrl.text.trim(),
            firmId: firm.id,
          );
      ref.invalidate(customersProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
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
          Text('New Customer', style: Theme.of(context).textTheme.headlineSmall),
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
            'contact',
            TextField(
              key: _v.keyFor('contact'),
              controller: _contactCtrl,
              keyboardType: TextInputType.phone,
              inputFormatters: phoneFormatters,
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(
                labelText: 'Contact number',
                helperText: '10 digit mobile number',
                errorText: _v.errorFor('contact'),
              ),
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
            'address',
            TextField(
              key: _v.keyFor('address'),
              controller: _addressCtrl,
              textCapitalization: TextCapitalization.sentences,
              inputFormatters: lengthLimit(kAddressMax),
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(labelText: 'Address', errorText: _v.errorFor('address')),
            ),
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
                : const Text('Save Customer'),
          ),
        ],
      ),
    );
  }
}
