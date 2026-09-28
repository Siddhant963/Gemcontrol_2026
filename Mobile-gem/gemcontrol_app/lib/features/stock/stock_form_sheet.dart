import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_client.dart';
import '../../core/models/charge_config.dart';
import '../../core/models/stock.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/stock_repository.dart';
import '../../core/theme/app_theme.dart';
import '../categories/categories_providers.dart';
import 'stock_providers.dart';

class StockFormSheet extends ConsumerStatefulWidget {
  final Stock? existing;
  const StockFormSheet({super.key, this.existing});

  @override
  ConsumerState<StockFormSheet> createState() => _StockFormSheetState();
}

class _StockFormSheetState extends ConsumerState<StockFormSheet> {
  final _nameCtrl = TextEditingController();
  final _karatCtrl = TextEditingController();
  final _grossCtrl = TextEditingController(text: '0');
  final _lessCtrl = TextEditingController(text: '0');
  final _qtyCtrl = TextEditingController(text: '1');
  final _priceCtrl = TextEditingController(text: '0');
  final _wastageSupplierCtrl = TextEditingController(text: '0');
  final _wastageCustomerCtrl = TextEditingController(text: '0');
  final _makingValueCtrl = TextEditingController(text: '0');
  final _labourValueCtrl = TextEditingController(text: '0');
  final _stoneChargeCtrl = TextEditingController(text: '0');
  final _hsnCtrl = TextEditingController(text: '7113');

  final _grossFocus = FocusNode();
  final _lessFocus = FocusNode();
  final _priceFocus = FocusNode();
  final _wastageSupplierFocus = FocusNode();
  final _wastageCustomerFocus = FocusNode();
  final _makingValueFocus = FocusNode();
  final _labourValueFocus = FocusNode();
  final _stoneChargeFocus = FocusNode();

  String _materialType = 'gold';
  StockType _stockType = StockType.retail;
  String? _categoryId;
  ChargeUnit _makingUnit = ChargeUnit.percent;
  ChargeUnit _labourUnit = ChargeUnit.fixed;
  XFile? _image;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final s = widget.existing;
    if (s != null) {
      _nameCtrl.text = s.name;
      _karatCtrl.text = s.karat;
      _grossCtrl.text = s.grossWeight.toString();
      _lessCtrl.text = s.lessWeight.toString();
      _qtyCtrl.text = s.quantity.toString();
      _priceCtrl.text = s.price.toString();
      _wastageSupplierCtrl.text = s.wastage.supplier.toString();
      _wastageCustomerCtrl.text = s.wastage.customer.toString();
      _makingValueCtrl.text = s.makingChargeConfig.value.toString();
      _labourValueCtrl.text = s.labourCharge.value.toString();
      _stoneChargeCtrl.text = s.stoneCharge.toString();
      _hsnCtrl.text = s.hsnCode;
      _materialType = s.materialType;
      _stockType = s.stockType;
      _categoryId = s.categoryId;
      _makingUnit = s.makingChargeConfig.unit;
      _labourUnit = s.labourCharge.unit;
    }
    for (final pair in [
      (_grossCtrl, _grossFocus),
      (_lessCtrl, _lessFocus),
      (_priceCtrl, _priceFocus),
      (_wastageSupplierCtrl, _wastageSupplierFocus),
      (_wastageCustomerCtrl, _wastageCustomerFocus),
      (_makingValueCtrl, _makingValueFocus),
      (_labourValueCtrl, _labourValueFocus),
      (_stoneChargeCtrl, _stoneChargeFocus),
    ]) {
      _clearZeroOnFocus(pair.$1, pair.$2);
    }
  }

  /// Clears a "0" placeholder value when the field gains focus, and restores
  /// it if the user leaves the field empty, so users don't have to manually
  /// delete the pre-filled zero before typing a real value.
  void _clearZeroOnFocus(TextEditingController controller, FocusNode node) {
    node.addListener(() {
      if (node.hasFocus && controller.text == '0') {
        controller.clear();
      } else if (!node.hasFocus && controller.text.trim().isEmpty) {
        controller.text = '0';
      }
    });
  }

  @override
  void dispose() {
    for (final c in [
      _nameCtrl,
      _karatCtrl,
      _grossCtrl,
      _lessCtrl,
      _qtyCtrl,
      _priceCtrl,
      _wastageSupplierCtrl,
      _wastageCustomerCtrl,
      _makingValueCtrl,
      _labourValueCtrl,
      _stoneChargeCtrl,
      _hsnCtrl,
    ]) {
      c.dispose();
    }
    for (final f in [
      _grossFocus,
      _lessFocus,
      _priceFocus,
      _wastageSupplierFocus,
      _wastageCustomerFocus,
      _makingValueFocus,
      _labourValueFocus,
      _stoneChargeFocus,
    ]) {
      f.dispose();
    }
    super.dispose();
  }

  double _num(TextEditingController c) => double.tryParse(c.text) ?? 0;

  Future<void> _pickImage() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _image = img);
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty || _categoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name and category are required')),
      );
      return;
    }
    if (!RegExp(r'[A-Za-z]').hasMatch(_nameCtrl.text)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name must contain letters, not just numbers')),
      );
      return;
    }
    final firm = ref.read(currentFirmProvider);
    if (firm == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No firm found — set up a firm in Settings first')),
      );
      return;
    }
    final grossWeight = _num(_grossCtrl);
    final lessWeight = _num(_lessCtrl);
    if (grossWeight - lessWeight <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a gross weight greater than the less weight')),
      );
      return;
    }
    if (_num(_priceCtrl) <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a price greater than 0')),
      );
      return;
    }
    setState(() => _saving = true);
    final fields = StockFields(
      name: _nameCtrl.text.trim(),
      materialType: _materialType,
      stockType: _stockType == StockType.wholesale ? 'wholesale' : 'retail',
      grossWeight: grossWeight,
      lessWeight: lessWeight,
      karat: _karatCtrl.text.trim(),
      categoryId: _categoryId!,
      firmId: firm.id,
      quantity: _num(_qtyCtrl),
      price: _num(_priceCtrl),
      wastageSupplier: _num(_wastageSupplierCtrl),
      wastageCustomer: _num(_wastageCustomerCtrl),
      makingChargeValue: _num(_makingValueCtrl),
      makingChargeUnit: chargeUnitToString(_makingUnit),
      labourChargeValue: _num(_labourValueCtrl),
      labourChargeUnit: chargeUnitToString(_labourUnit),
      stoneCharge: _num(_stoneChargeCtrl),
      hsnCode: _hsnCtrl.text.trim(),
    );
    try {
      final repo = ref.read(stockRepositoryProvider);
      if (_isEdit) {
        await repo.updateStock(widget.existing!.id, fields, imagePath: _image?.path);
      } else {
        await repo.addStock(fields, imagePath: _image?.path);
      }
      ref.invalidate(stockListProvider);
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
    final categoriesAsync = ref.watch(categoriesProvider);
    final scheme = Theme.of(context).colorScheme;
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.xl,
          ),
          children: [
            Text(
              _isEdit ? 'Edit Stock Item' : 'New Stock Item',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: AppSpacing.md),
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 110,
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(AppRadii.sm),
                  image: _image != null
                      ? DecorationImage(image: FileImage(File(_image!.path)), fit: BoxFit.cover)
                      : null,
                ),
                child: _image == null
                    ? Center(
                        child: Icon(Icons.add_photo_alternate_outlined, color: scheme.outline),
                      )
                    : null,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Item name')),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _materialType,
                    decoration: const InputDecoration(labelText: 'Material'),
                    items: const ['gold', 'silver', 'platinum', 'diamond', 'other']
                        .map((m) => DropdownMenuItem(value: m, child: Text(materialTypeLabel(m))))
                        .toList(),
                    onChanged: (v) => setState(() => _materialType = v!),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: DropdownButtonFormField<StockType>(
                    initialValue: _stockType,
                    decoration: const InputDecoration(labelText: 'Stock type'),
                    items: const [
                      DropdownMenuItem(value: StockType.retail, child: Text('Retail')),
                      DropdownMenuItem(value: StockType.wholesale, child: Text('Wholesale')),
                    ],
                    onChanged: (v) => setState(() => _stockType = v!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            categoriesAsync.when(
              data: (categories) => categories.isEmpty
                  ? Container(
                      padding: const EdgeInsets.all(AppSpacing.sm),
                      decoration: BoxDecoration(
                        border: Border.all(color: scheme.outlineVariant),
                        borderRadius: BorderRadius.circular(AppRadii.sm),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, size: 18, color: scheme.outline),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              'No categories yet — add one from Categories before creating stock.',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    )
                  : DropdownButtonFormField<String>(
                      initialValue: _categoryId,
                      decoration: const InputDecoration(labelText: 'Category'),
                      items: categories
                          .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                          .toList(),
                      onChanged: (v) => setState(() => _categoryId = v),
                    ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const Text('Could not load categories'),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _karatCtrl, decoration: const InputDecoration(labelText: 'Karat (e.g. 22K)')),
            const SizedBox(height: AppSpacing.lg),
            Text('Weight (grams)', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _grossCtrl,
                    focusNode: _grossFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Gross weight'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _lessCtrl,
                    focusNode: _lessFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Less weight'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _qtyCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Quantity'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _priceCtrl,
                    focusNode: _priceFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Price (₹)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Wastage %', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _wastageSupplierCtrl,
                    focusNode: _wastageSupplierFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'From supplier'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _wastageCustomerCtrl,
                    focusNode: _wastageCustomerFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'To customer'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Making Charge', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _makingValueCtrl,
                    focusNode: _makingValueFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Value'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: _unitDropdown(_makingUnit, (u) => setState(() => _makingUnit = u))),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Labour Charge', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _labourValueCtrl,
                    focusNode: _labourValueFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Value'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: _unitDropdown(_labourUnit, (u) => setState(() => _labourUnit = u))),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _stoneChargeCtrl,
                    focusNode: _stoneChargeFocus,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Stone charge (₹)'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _hsnCtrl,
                    decoration: const InputDecoration(labelText: 'HSN code'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(_isEdit ? 'Save Changes' : 'Add Stock Item'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _unitDropdown(ChargeUnit value, ValueChanged<ChargeUnit> onChanged) {
    return DropdownButtonFormField<ChargeUnit>(
      initialValue: value,
      decoration: const InputDecoration(labelText: 'Unit'),
      items: ChargeUnit.values
          .map((u) => DropdownMenuItem(value: u, child: Text(chargeUnitLabel(u))))
          .toList(),
      onChanged: (v) => onChanged(v!),
    );
  }
}
