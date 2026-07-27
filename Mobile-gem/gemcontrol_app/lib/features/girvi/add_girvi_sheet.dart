import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_client.dart';
import '../../core/models/customer.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/girvi_repository.dart';
import '../../core/theme/app_theme.dart';
import '../customers/customers_providers.dart';
import 'girvi_providers.dart';

class AddGirviSheet extends ConsumerStatefulWidget {
  const AddGirviSheet({super.key});

  @override
  ConsumerState<AddGirviSheet> createState() => _AddGirviSheetState();
}

class _AddGirviSheetState extends ConsumerState<AddGirviSheet> {
  final _itemNameCtrl = TextEditingController();
  final _itemTypeCtrl = TextEditingController(text: 'gold');
  final _weightCtrl = TextEditingController(text: '0');
  final _valueCtrl = TextEditingController(text: '0');
  final _descCtrl = TextEditingController();
  final _interestCtrl = TextEditingController(text: '2');
  Customer? _customer;
  DateTime _lastDateToTake = DateTime.now().add(const Duration(days: 180));
  XFile? _image;
  bool _saving = false;

  Future<void> _pickImage() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _image = img);
  }

  Future<void> _save() async {
    final firm = ref.read(currentFirmProvider);
    if (_itemNameCtrl.text.trim().isEmpty || _customer == null || _image == null || firm == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Item name, customer and photo are required')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(girviRepositoryProvider).addGirviItem(
            itemName: _itemNameCtrl.text.trim(),
            itemType: _itemTypeCtrl.text.trim(),
            itemWeight: double.tryParse(_weightCtrl.text) ?? 0,
            itemValue: double.tryParse(_valueCtrl.text) ?? 0,
            itemDescription: _descCtrl.text.trim(),
            interestRate: double.tryParse(_interestCtrl.text) ?? 0,
            customerId: _customer!.id,
            firmId: firm.id,
            lastDateToTake: _lastDateToTake,
            imagePath: _image!.path,
          );
      ref.invalidate(girviItemsProvider);
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
    final customersAsync = ref.watch(customersProvider);
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xl),
          children: [
            Text('New Girvi (Pledge)', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.md),
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 110,
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(AppRadii.sm),
                  image: _image != null
                      ? DecorationImage(image: FileImage(File(_image!.path)), fit: BoxFit.cover)
                      : null,
                ),
                child: _image == null
                    ? const Center(child: Icon(Icons.add_photo_alternate_outlined, color: AppColors.outline))
                    : null,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            customersAsync.when(
              data: (customers) => DropdownButtonFormField<Customer>(
                initialValue: _customer,
                decoration: const InputDecoration(labelText: 'Customer'),
                items: customers.map((c) => DropdownMenuItem(value: c, child: Text(c.name))).toList(),
                onChanged: (v) => setState(() => _customer = v),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const Text('Could not load customers'),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _itemNameCtrl, decoration: const InputDecoration(labelText: 'Item name')),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: TextField(controller: _itemTypeCtrl, decoration: const InputDecoration(labelText: 'Item type')),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _weightCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Weight (g)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _valueCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Item value / loan (₹)'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _interestCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Monthly interest %'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description')),
            const SizedBox(height: AppSpacing.sm),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Last date to take (redeem by)'),
              subtitle: Text('${_lastDateToTake.toLocal()}'.split(' ').first),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _lastDateToTake,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 3650)),
                );
                if (picked != null) setState(() => _lastDateToTake = picked);
              },
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
                  : const Text('Save Girvi Item'),
            ),
          ],
        ),
      ),
    );
  }
}
