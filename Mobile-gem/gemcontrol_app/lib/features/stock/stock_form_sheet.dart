import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/models/charge_config.dart';
import '../../core/models/stock.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/stock_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/forms/live_validation.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/app_toast.dart';
import '../../shared/widgets/form_error_banner.dart';
import '../categories/categories_providers.dart';
import 'karat_options.dart';
import 'stock_providers.dart';

class StockFormSheet extends ConsumerStatefulWidget {
  final Stock? existing;
  const StockFormSheet({super.key, this.existing});

  @override
  ConsumerState<StockFormSheet> createState() => _StockFormSheetState();
}

class _StockFormSheetState extends ConsumerState<StockFormSheet> {
  final _nameCtrl = TextEditingController();
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
  // Karat/carat is a fixed list now (see karat_options.dart): gold and diamond
  // MUST have one, other materials have none.
  String? _karat;
  StockType _stockType = StockType.retail;
  String? _categoryId;
  ChargeUnit _makingUnit = ChargeUnit.percent;
  ChargeUnit _labourUnit = ChargeUnit.fixed;
  XFile? _image;
  bool _saving = false;

  static const _order = [
    'name', 'category', 'karat', 'gross', 'less', 'quantity', 'price',
    'wastageSupplier', 'wastageCustomer', 'making', 'labour', 'stone', 'hsn',
  ];

  // Field-level validation (see LiveValidation): errors show as the user
  // leaves a box, all at once on Save, and clear as soon as the value is OK.
  late final LiveValidation _v = LiveValidation(_rules, () {
    if (mounted) setState(() {});
  });

  double _num(TextEditingController c) => double.tryParse(c.text) ?? 0;

  String? _chargeRule(String text, String label, ChargeUnit unit) =>
      nonNegativeNumberRule(text, label, max: unit == ChargeUnit.percent ? 100 : 1000000000);

  // The same rules the backend enforces (Addstock), checked up front.
  Map<String, String> _rules() {
    final net = _num(_grossCtrl) - _num(_lessCtrl);
    final needsKarat = karatOptionsFor(_materialType).isNotEmpty;
    final hsn = _hsnCtrl.text.trim();
    return errorsOf({
      'name': nameRule(_nameCtrl.text, label: 'Item name'),
      'category': _categoryId == null ? 'Category is required' : null,
      'karat': needsKarat && _karat == null ? 'Select the ${karatLabelFor(_materialType).toLowerCase()}' : null,
      'gross': positiveNumberRule(_grossCtrl.text, 'Gross weight', max: 100000) ??
          (net <= 0 ? 'Enter a gross weight greater than the less weight' : null),
      'less': nonNegativeNumberRule(_lessCtrl.text, 'Less weight', max: 100000),
      'quantity': positiveNumberRule(_qtyCtrl.text, 'Quantity', max: 1000000),
      'price': positiveNumberRule(_priceCtrl.text, 'Price', max: 1000000000),
      'wastageSupplier': nonNegativeNumberRule(_wastageSupplierCtrl.text, 'Wastage', max: 100),
      'wastageCustomer': nonNegativeNumberRule(_wastageCustomerCtrl.text, 'Wastage', max: 100),
      'making': _chargeRule(_makingValueCtrl.text, 'Making charge', _makingUnit),
      'labour': _chargeRule(_labourValueCtrl.text, 'Labour charge', _labourUnit),
      'stone': nonNegativeNumberRule(_stoneChargeCtrl.text, 'Stone charge', max: 1000000000),
      'hsn': hsn.isNotEmpty && !RegExp(r'^\d{4,8}$').hasMatch(hsn) ? 'HSN code must be 4 to 8 digits' : null,
    });
  }

  // The backend replies with a message only; map the known ones to a field.
  String? _fieldForServerMessage(String message) {
    final m = message.toLowerCase();
    if (m.contains('karat') || m.contains('carat')) return 'karat';
    if (m.contains('item name') || m.contains('name must')) return 'name';
    if (m.contains('category')) return 'category';
    if (m.contains('less weight')) return 'less';
    if (m.contains('weight')) return 'gross';
    if (m.contains('quantity')) return 'quantity';
    if (m.contains('price')) return 'price';
    if (m.contains('labour')) return 'labour';
    if (m.contains('stone')) return 'stone';
    return null;
  }

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final s = widget.existing;
    if (s != null) {
      _nameCtrl.text = s.name;
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
      // An older item may hold "22" / "22k"; map it to the exact option, or
      // leave it unselected so the user is asked to pick (never crash).
      _karat = normalizeKarat(s.materialType, s.karat);
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

  Future<void> _pickImage() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _image = img);
  }

  Future<void> _save() async {
    if (!_v.validateAll()) {
      AppToast.show(context, 'Please fix the highlighted fields.', type: AppToastType.warning);
      _v.scrollToFirstError(_order);
      return;
    }
    final firm = ref.read(currentFirmProvider);
    if (firm == null) {
      AppToast.show(
        context,
        'No firm found — set up a firm in Settings first',
        type: AppToastType.warning,
      );
      return;
    }
    setState(() => _saving = true);
    final fields = StockFields(
      name: _nameCtrl.text.trim(),
      materialType: _materialType,
      stockType: _stockType == StockType.wholesale ? 'wholesale' : 'retail',
      grossWeight: _num(_grossCtrl),
      lessWeight: _num(_lessCtrl),
      karat: karatOptionsFor(_materialType).isEmpty ? '' : (_karat ?? ''),
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
      if (mounted) {
        AppToast.show(
          context,
          _isEdit ? 'Stock item updated.' : 'Stock item added.',
          type: AppToastType.success,
        );
        Navigator.pop(context);
      }
    } catch (e) {
      // ANY failure is shown (an ApiException keeps the server's words), on
      // the field it belongs to when we can tell, otherwise in the form.
      if (mounted) {
        final message = _v.describeError(e, fieldFor: _fieldForServerMessage);
        AppToast.show(context, message, type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _numberField({
    required String field,
    required TextEditingController controller,
    required String label,
    FocusNode? focusNode,
    int decimals = 2,
    int maxLength = 12,
  }) {
    return _v.wrap(
      field,
      TextField(
        key: _v.keyFor(field),
        controller: controller,
        focusNode: focusNode,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        inputFormatters: decimalFormatters(decimals: decimals, maxLength: maxLength),
        onChanged: (_) => _v.changed(),
        decoration: InputDecoration(
          labelText: label,
          errorText: _v.errorFor(field),
          errorMaxLines: 3,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final scheme = Theme.of(context).colorScheme;
    final karatOptions = karatOptionsFor(_materialType);
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
            FormErrorBanner(_v.formError),
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
            _v.wrap(
              'name',
              TextField(
                key: _v.keyFor('name'),
                controller: _nameCtrl,
                textCapitalization: TextCapitalization.words,
                inputFormatters: lengthLimit(kNameMax),
                onChanged: (_) => _v.changed(),
                decoration: InputDecoration(labelText: 'Item name', errorText: _v.errorFor('name')),
              ),
            ),
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
                    onChanged: (v) {
                      setState(() {
                        _materialType = v!;
                        // a gold karat is meaningless for diamond, etc.
                        if (!karatOptionsFor(_materialType).contains(_karat)) _karat = null;
                      });
                      _v.changed();
                    },
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
                  : _v.wrap(
                      'category',
                      DropdownButtonFormField<String>(
                        key: _v.keyFor('category'),
                        initialValue: _categoryId,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: 'Category',
                          errorText: _v.errorFor('category'),
                        ),
                        items: categories
                            .map((c) => DropdownMenuItem(
                                  value: c.id,
                                  child: Text(c.name, overflow: TextOverflow.ellipsis),
                                ))
                            .toList(),
                        onChanged: (v) {
                          setState(() => _categoryId = v);
                          _v.changed();
                        },
                      ),
                    ),
              loading: () => const LinearProgressIndicator(),
              error: (error, stackTrace) => const Text('Could not load categories'),
            ),
            if (karatOptions.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              _v.wrap(
                'karat',
                DropdownButtonFormField<String>(
                  // re-created when the material changes so the list resets
                  key: ValueKey('karat-$_materialType'),
                  initialValue: _karat,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: karatLabelFor(_materialType),
                    errorText: _v.errorFor('karat'),
                  ),
                  items: karatOptions.map((k) => DropdownMenuItem(value: k, child: Text(k))).toList(),
                  onChanged: (v) {
                    setState(() => _karat = v);
                    _v.changed();
                  },
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            Text('Weight (grams)', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _numberField(
                    field: 'gross',
                    controller: _grossCtrl,
                    focusNode: _grossFocus,
                    label: 'Gross weight',
                    decimals: 3,
                    maxLength: 10,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _numberField(
                    field: 'less',
                    controller: _lessCtrl,
                    focusNode: _lessFocus,
                    label: 'Less weight',
                    decimals: 3,
                    maxLength: 10,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _numberField(
                    field: 'quantity',
                    controller: _qtyCtrl,
                    label: 'Quantity',
                    decimals: 2,
                    maxLength: 9,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _numberField(
                    field: 'price',
                    controller: _priceCtrl,
                    focusNode: _priceFocus,
                    label: 'Price (₹)',
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Wastage %', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _numberField(
                    field: 'wastageSupplier',
                    controller: _wastageSupplierCtrl,
                    focusNode: _wastageSupplierFocus,
                    label: 'From supplier',
                    maxLength: 6,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _numberField(
                    field: 'wastageCustomer',
                    controller: _wastageCustomerCtrl,
                    focusNode: _wastageCustomerFocus,
                    label: 'To customer',
                    maxLength: 6,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Making Charge', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _numberField(
                    field: 'making',
                    controller: _makingValueCtrl,
                    focusNode: _makingValueFocus,
                    label: 'Value',
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: _unitDropdown(_makingUnit, (u) => _makingUnit = u)),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Labour Charge', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.md),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _numberField(
                    field: 'labour',
                    controller: _labourValueCtrl,
                    focusNode: _labourValueFocus,
                    label: 'Value',
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: _unitDropdown(_labourUnit, (u) => _labourUnit = u)),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _numberField(
                    field: 'stone',
                    controller: _stoneChargeCtrl,
                    focusNode: _stoneChargeFocus,
                    label: 'Stone charge (₹)',
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _v.wrap(
                    'hsn',
                    TextField(
                      key: _v.keyFor('hsn'),
                      controller: _hsnCtrl,
                      keyboardType: TextInputType.number,
                      inputFormatters: digitsFormatters(8),
                      onChanged: (_) => _v.changed(),
                      decoration: InputDecoration(labelText: 'HSN code', errorText: _v.errorFor('hsn')),
                    ),
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

  Widget _unitDropdown(ChargeUnit value, void Function(ChargeUnit) assign) {
    return DropdownButtonFormField<ChargeUnit>(
      initialValue: value,
      decoration: const InputDecoration(labelText: 'Unit'),
      items: ChargeUnit.values
          .map((u) => DropdownMenuItem(value: u, child: Text(chargeUnitLabel(u))))
          .toList(),
      onChanged: (v) {
        setState(() => assign(v!));
        _v.changed(); // percent has a 100 cap, other units don't
      },
    );
  }
}
