import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/api_client.dart';
import '../../core/models/customer.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/customer_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'customers_providers.dart';

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
      appBar: GcAppBar(title: 'Customers'),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
          ),
          builder: (_) => const _AddCustomerSheet(),
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
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 4),
        leading: CircleAvatar(
          backgroundColor: AppColors.primaryContainer.withValues(alpha: 0.3),
          child: Text(
            customer.name.isNotEmpty ? customer.name[0].toUpperCase() : '?',
            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(customer.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${customer.contact}\n${customer.address}'),
        isThreeLine: true,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.call_outlined, color: AppColors.primary, size: 20),
              onPressed: () => launchUrl(Uri.parse('tel:${customer.contact}')),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
              onPressed: () async {
                await ref.read(customerRepositoryProvider).removeCustomer(customer.id);
                ref.invalidate(customersProvider);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _AddCustomerSheet extends ConsumerStatefulWidget {
  const _AddCustomerSheet();
  @override
  ConsumerState<_AddCustomerSheet> createState() => _AddCustomerSheetState();
}

class _AddCustomerSheetState extends ConsumerState<_AddCustomerSheet> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _saving = false;

  Future<void> _save() async {
    final firm = ref.read(currentFirmProvider);
    if (_nameCtrl.text.trim().isEmpty || firm == null) return;
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
          Text('New Customer', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.md),
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _contactCtrl,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Contact number'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(controller: _addressCtrl, decoration: const InputDecoration(labelText: 'Address')),
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
