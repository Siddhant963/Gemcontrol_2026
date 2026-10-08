import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/models/customer.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/girvi_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/forms/live_validation.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/app_toast.dart';
import '../../shared/widgets/form_error_banner.dart';
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
  final _weightCtrl = TextEditingController();
  final _valueCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _interestCtrl = TextEditingController(text: '2');
  Customer? _customer;
  DateTime _lastDateToTake = DateTime.now().add(const Duration(days: 180));
  XFile? _image;
  bool _saving = false;

  static const _order = ['photo', 'customer', 'itemName', 'itemType', 'weight', 'value', 'interest', 'description'];

  // The backend requires every one of these (incl. the photo and the
  // description) -- so each is checked here, inline, before any request.
  late final LiveValidation _v = LiveValidation(_rules, () {
    if (mounted) setState(() {});
  });

  Map<String, String> _rules() => errorsOf({
    'photo': _image == null ? 'Add a photo of the item' : null,
    'customer': _customer == null ? 'Select a customer' : null,
    'itemName': nameRule(_itemNameCtrl.text, label: 'Item name'),
    'itemType': textRule(_itemTypeCtrl.text, 'Item type'),
    'weight': positiveNumberRule(_weightCtrl.text, 'Weight', max: 100000),
    'value': positiveNumberRule(_valueCtrl.text, 'Item value', max: 1000000000),
    'interest': positiveNumberRule(_interestCtrl.text, 'Interest', max: 100),
    'description': textRule(_descCtrl.text, 'Description', max: kDescriptionMax),
  });

  String? _fieldForServerMessage(String message) {
    final m = message.toLowerCase();
    if (m.contains('item name')) return 'itemName';
    if (m.contains('customer')) return 'customer';
    return null;
  }

  @override
  void dispose() {
    _itemNameCtrl.dispose();
    _itemTypeCtrl.dispose();
    _weightCtrl.dispose();
    _valueCtrl.dispose();
    _descCtrl.dispose();
    _interestCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) {
      setState(() => _image = img);
      _v.changed();
    }
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
      await ref.read(girviRepositoryProvider).addGirviItem(
            itemName: _itemNameCtrl.text.trim(),
            itemType: _itemTypeCtrl.text.trim(),
            itemWeight: double.parse(_weightCtrl.text.trim()),
            itemValue: double.parse(_valueCtrl.text.trim()),
            itemDescription: _descCtrl.text.trim(),
            interestRate: double.parse(_interestCtrl.text.trim()),
            customerId: _customer!.id,
            firmId: firm.id,
            lastDateToTake: _lastDateToTake,
            imagePath: _image!.path,
          );
      ref.invalidate(girviItemsProvider);
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
    final customersAsync = ref.watch(customersProvider);
    final scheme = Theme.of(context).colorScheme;
    final photoError = _v.errorFor('photo');
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
            FormErrorBanner(_v.formError),
            GestureDetector(
              key: _v.keyFor('photo'),
              onTap: _pickImage,
              child: Container(
                height: 110,
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(AppRadii.sm),
                  border: photoError != null ? Border.all(color: scheme.error) : null,
                  image: _image != null
                      ? DecorationImage(image: FileImage(File(_image!.path)), fit: BoxFit.cover)
                      : null,
                ),
                child: _image == null
                    ? Center(child: Icon(Icons.add_photo_alternate_outlined, color: photoError != null ? scheme.error : scheme.outline))
                    : null,
              ),
            ),
            if (photoError != null)
              Padding(
                padding: const EdgeInsets.only(top: 4, left: 12),
                child: Text(photoError, style: TextStyle(color: scheme.error, fontSize: 12)),
              ),
            const SizedBox(height: AppSpacing.md),
            customersAsync.when(
              data: (customers) => _v.wrap(
                'customer',
                DropdownButtonFormField<Customer>(
                  key: _v.keyFor('customer'),
                  initialValue: _customer,
                  isExpanded: true,
                  decoration: InputDecoration(labelText: 'Customer', errorText: _v.errorFor('customer')),
                  items: customers
                      .map((c) => DropdownMenuItem(value: c, child: Text(c.name, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (v) {
                    setState(() => _customer = v);
                    _v.changed();
                  },
                ),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (error, stackTrace) => const Text('Could not load customers'),
            ),
            const SizedBox(height: AppSpacing.sm),
            _v.wrap(
              'itemName',
              TextField(
                key: _v.keyFor('itemName'),
                controller: _itemNameCtrl,
                textCapitalization: TextCapitalization.words,
                inputFormatters: lengthLimit(kNameMax),
                onChanged: (_) => _v.changed(),
                decoration: InputDecoration(labelText: 'Item name', errorText: _v.errorFor('itemName')),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _v.wrap(
                    'itemType',
                    TextField(
                      key: _v.keyFor('itemType'),
                      controller: _itemTypeCtrl,
                      inputFormatters: lengthLimit(kShortTextMax),
                      onChanged: (_) => _v.changed(),
                      decoration: InputDecoration(labelText: 'Item type', errorText: _v.errorFor('itemType')),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _v.wrap(
                    'weight',
                    TextField(
                      key: _v.keyFor('weight'),
                      controller: _weightCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: decimalFormatters(decimals: 3, maxLength: 10),
                      onChanged: (_) => _v.changed(),
                      decoration: InputDecoration(
                        labelText: 'Weight (g)',
                        errorText: _v.errorFor('weight'),
                        errorMaxLines: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _v.wrap(
                    'value',
                    TextField(
                      key: _v.keyFor('value'),
                      controller: _valueCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: decimalFormatters(decimals: 2, maxLength: 12),
                      onChanged: (_) => _v.changed(),
                      decoration: InputDecoration(
                        labelText: 'Item value / loan (₹)',
                        errorText: _v.errorFor('value'),
                        errorMaxLines: 2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _v.wrap(
                    'interest',
                    TextField(
                      key: _v.keyFor('interest'),
                      controller: _interestCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: decimalFormatters(decimals: 2, maxLength: 6),
                      onChanged: (_) => _v.changed(),
                      decoration: InputDecoration(
                        labelText: 'Monthly interest %',
                        errorText: _v.errorFor('interest'),
                        errorMaxLines: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            _v.wrap(
              'description',
              TextField(
                key: _v.keyFor('description'),
                controller: _descCtrl,
                textCapitalization: TextCapitalization.sentences,
                inputFormatters: lengthLimit(kDescriptionMax),
                onChanged: (_) => _v.changed(),
                decoration: InputDecoration(labelText: 'Description', errorText: _v.errorFor('description')),
              ),
            ),
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
