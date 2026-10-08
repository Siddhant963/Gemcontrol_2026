
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_client.dart';
import '../../core/models/firm.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/firm_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/forms/live_validation.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/form_error_banner.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/app_toast.dart';

class FirmScreen extends ConsumerWidget {
  const FirmScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final firmsAsync = ref.watch(firmsProvider);
    final hasFirm = firmsAsync.valueOrNull?.isNotEmpty ?? false;
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Firm Management'),
      // One firm per shop -- once it exists, there's nothing left to "add",
      // only to edit (tap the row below). Showing this FAB regardless used
      // to lead an already-set-up admin into createFirm, which the backend
      // correctly rejects ("Your account already has a firm"), reading as a
      // confusing failure to save.
      floatingActionButton: hasFirm
          ? null
          : FloatingActionButton(
              onPressed: () => showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                useSafeArea: true,
                builder: (_) => const _FirmFormSheet(),
              ),
              child: const Icon(Icons.add_business_outlined),
            ),
      body: AsyncValueWidget<List<Firm>>(
        value: firmsAsync,
        onRetry: () => ref.invalidate(firmsProvider),
        isEmpty: (d) => d.isEmpty,
        emptyWidget: const EmptyState(
          icon: Icons.storefront_outlined,
          message: 'No firm set up yet.\nTap + to create one.',
        ),
        data: (firms) => ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: firms.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final f = firms[i];
            return Card(
              child: ListTile(
                title: Text(f.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text('${f.location}\nGST: ${f.gst.isEmpty ? "-" : f.gst}'),
                isThreeLine: true,
                trailing: const Icon(Icons.edit_outlined),
                onTap: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  useSafeArea: true,
                  builder: (_) => _FirmFormSheet(existing: f),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

enum _FirmImageField { logo, firmStamp, ownerSignature, secondLogo }

class _FirmFormSheet extends ConsumerStatefulWidget {
  final Firm? existing;
  const _FirmFormSheet({this.existing});

  @override
  ConsumerState<_FirmFormSheet> createState() => _FirmFormSheetState();
}

class _FirmFormSheetState extends ConsumerState<_FirmFormSheet> {
  final _nameCtrl = TextEditingController();
  final _shopNameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _proprietorNameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();
  final _registrationNoCtrl = TextEditingController();
  final _panNoCtrl = TextEditingController();
  final _gstCtrl = TextEditingController();
  final _invoicePrefixCtrl = TextEditingController();
  final _cgstCtrl = TextEditingController(text: '1.5');
  final _sgstCtrl = TextEditingController(text: '1.5');
  final _igstCtrl = TextEditingController(text: '0');
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();
  final _branchCtrl = TextEditingController();
  final _accountNoCtrl = TextEditingController();
  final _ifscCodeCtrl = TextEditingController();
  DateTime? _firmStartDate;

  final Map<_FirmImageField, XFile> _newImages = {};
  final Map<_FirmImageField, Uint8List> _newImageBytes = {};
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final f = widget.existing;
    if (f != null) {
      _nameCtrl.text = f.name;
      _shopNameCtrl.text = f.shopName;
      _descriptionCtrl.text = f.description;
      _locationCtrl.text = f.location;
      _proprietorNameCtrl.text = f.proprietorName;
      _addressCtrl.text = f.address;
      _cityCtrl.text = f.city;
      _pincodeCtrl.text = f.pincode;
      _registrationNoCtrl.text = f.registrationNo;
      _panNoCtrl.text = f.panNo;
      _gstCtrl.text = f.gst;
      _invoicePrefixCtrl.text = f.invoicePrefix;
      _cgstCtrl.text = f.gstConfig.cgstRate.toString();
      _sgstCtrl.text = f.gstConfig.sgstRate.toString();
      _igstCtrl.text = f.gstConfig.igstRate.toString();
      _emailCtrl.text = f.email;
      _contactCtrl.text = f.contact;
      _bankNameCtrl.text = f.bankName;
      _branchCtrl.text = f.branch;
      _accountNoCtrl.text = f.accountNo;
      _ifscCodeCtrl.text = f.ifscCode;
      _firmStartDate = f.firmStartDate;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _shopNameCtrl.dispose();
    _descriptionCtrl.dispose();
    _locationCtrl.dispose();
    _proprietorNameCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _pincodeCtrl.dispose();
    _registrationNoCtrl.dispose();
    _panNoCtrl.dispose();
    _gstCtrl.dispose();
    _invoicePrefixCtrl.dispose();
    _cgstCtrl.dispose();
    _sgstCtrl.dispose();
    _igstCtrl.dispose();
    _emailCtrl.dispose();
    _contactCtrl.dispose();
    _bankNameCtrl.dispose();
    _branchCtrl.dispose();
    _accountNoCtrl.dispose();
    _ifscCodeCtrl.dispose();
    super.dispose();
  }

  late final LiveValidation _v = LiveValidation(_rules, () {
    if (mounted) setState(() {});
  });

  static const _order = [
    'name', 'shopName', 'description', 'location', 'proprietor', 'address', 'city', 'pincode',
    'registration', 'pan', 'gst', 'prefix', 'cgst', 'sgst', 'igst', 'email', 'contact',
    'bankName', 'branch', 'accountNo', 'ifsc',
  ];

  // Only the firm name is required (as before); every other box is checked
  // for format/length when it is filled in.
  static String? _format(String value, RegExp re, String message) {
    final v = value.trim();
    return v.isEmpty || re.hasMatch(v) ? null : message;
  }

  Map<String, String> _rules() => errorsOf({
    'name': nameRule(_nameCtrl.text, label: 'Firm name'),
    'shopName': textRule(_shopNameCtrl.text, 'Shop name', max: kNameMax, required: false),
    'description': textRule(_descriptionCtrl.text, 'Description', max: kDescriptionMax, required: false),
    'location': textRule(_locationCtrl.text, 'Location', max: kAddressMax, required: false),
    'proprietor': textRule(_proprietorNameCtrl.text, 'Proprietor name', max: kNameMax, required: false),
    'address': textRule(_addressCtrl.text, 'Address', max: kAddressMax, required: false),
    'city': textRule(_cityCtrl.text, 'City', max: kShortTextMax, required: false),
    'pincode': _format(_pincodeCtrl.text, RegExp(r'^\d{6}$'), 'Pincode must be 6 digits'),
    'registration': textRule(_registrationNoCtrl.text, 'Registration no.', max: 30, required: false),
    'pan': _format(_panNoCtrl.text.toUpperCase(), RegExp(r'^[A-Z]{5}\d{4}[A-Z]$'), 'PAN must look like ABCDE1234F'),
    'gst': _format(
      _gstCtrl.text.toUpperCase(),
      RegExp(r'^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$'),
      'GSTIN must be 15 characters, e.g. 22ABCDE1234F1Z5',
    ),
    'prefix': textRule(_invoicePrefixCtrl.text, 'Invoice prefix', max: 10, required: false),
    'cgst': nonNegativeNumberRule(_cgstCtrl.text, 'CGST', max: 100),
    'sgst': nonNegativeNumberRule(_sgstCtrl.text, 'SGST', max: 100),
    'igst': nonNegativeNumberRule(_igstCtrl.text, 'IGST', max: 100),
    'email': _emailCtrl.text.trim().isEmpty ? null : emailRule(_emailCtrl.text),
    'contact': _contactCtrl.text.trim().isEmpty ? null : phoneRule(_contactCtrl.text, label: 'Contact'),
    'bankName': textRule(_bankNameCtrl.text, 'Bank name', max: kShortTextMax, required: false),
    'branch': textRule(_branchCtrl.text, 'Branch', max: kShortTextMax, required: false),
    'accountNo': _format(_accountNoCtrl.text, RegExp(r'^\d{9,18}$'), 'Account number must be 9 to 18 digits'),
    'ifsc': _format(
      _ifscCodeCtrl.text.toUpperCase(),
      RegExp(r'^[A-Z]{4}0[A-Z\d]{6}$'),
      'IFSC must be 11 characters, e.g. SBIN0001234',
    ),
  });

  Widget _field(
    String key,
    TextEditingController ctrl,
    String label, {
    int max = kShortTextMax,
    int maxLines = 1,
    TextInputType? keyboard,
    List<TextInputFormatter>? formatters,
    TextCapitalization caps = TextCapitalization.none,
    String? helper,
  }) => _v.wrap(
    key,
    TextField(
      key: _v.keyFor(key),
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboard,
      textCapitalization: caps,
      inputFormatters: formatters ?? lengthLimit(max),
      onChanged: (_) => _v.changed(),
      decoration: InputDecoration(
        labelText: label,
        helperText: helper,
        errorText: _v.errorFor(key),
        errorMaxLines: 2,
      ),
    ),
  );

  Widget _pct(String key, TextEditingController ctrl, String label) => _field(
    key,
    ctrl,
    label,
    keyboard: const TextInputType.numberWithOptions(decimal: true),
    formatters: decimalFormatters(decimals: 2, maxLength: 6),
  );

  Future<void> _pickImage(_FirmImageField field) async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img == null) return;
    final bytes = await img.readAsBytes();
    setState(() {
      _newImages[field] = img;
      _newImageBytes[field] = bytes;
    });
  }

  Future<void> _pickFirmStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _firmStartDate ?? DateTime.now(),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _firmStartDate = picked);
  }

  Future<void> _save() async {
    if (!_v.validateAll()) {
      AppToast.show(context, 'Please fix the highlighted fields.', type: AppToastType.warning);
      _v.scrollToFirstError(_order);
      return;
    }
    setState(() => _saving = true);
    final fields = {
      'name': _nameCtrl.text.trim(),
      'shopName': _shopNameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim(),
      'location': _locationCtrl.text.trim(),
      'size': 1,
      'proprietorName': _proprietorNameCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
      'city': _cityCtrl.text.trim(),
      'pincode': _pincodeCtrl.text.trim(),
      'registrationNo': _registrationNoCtrl.text.trim(),
      'panNo': _panNoCtrl.text.trim().toUpperCase(),
      'gst': _gstCtrl.text.trim().toUpperCase(),
      'invoicePrefix': _invoicePrefixCtrl.text.trim(),
      'cgstRate': double.tryParse(_cgstCtrl.text.trim()) ?? 1.5,
      'sgstRate': double.tryParse(_sgstCtrl.text) ?? 1.5,
      'igstRate': double.tryParse(_igstCtrl.text) ?? 0,
      'gstEnabled': true,
      'email': _emailCtrl.text.trim(),
      'contact': _contactCtrl.text.trim(),
      'bankName': _bankNameCtrl.text.trim(),
      'branch': _branchCtrl.text.trim(),
      'accountNo': _accountNoCtrl.text.trim(),
      'ifscCode': _ifscCodeCtrl.text.trim().toUpperCase(),
      if (_firmStartDate != null) 'firmStartDate': _firmStartDate!.toIso8601String(),
    };
    final images = {
      'logo': _newImages[_FirmImageField.logo],
      'firmStamp': _newImages[_FirmImageField.firmStamp],
      'ownerSignature': _newImages[_FirmImageField.ownerSignature],
      'secondLogo': _newImages[_FirmImageField.secondLogo],
    };
    try {
      final repo = ref.read(firmRepositoryProvider);
      if (_isEdit) {
        await repo.updateFirm(widget.existing!.id, fields, images: images);
      } else {
        await repo.createFirm(fields, images: images);
      }
      ref.invalidate(firmsProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        AppToast.show(context, _v.describeError(e), type: AppToastType.error);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _imagePicker(_FirmImageField field, String label, String? existingPath) {
    final scheme = Theme.of(context).colorScheme;
    final bytes = _newImageBytes[field];
    final existingUrl = (existingPath != null && existingPath.isNotEmpty) ? resolveUploadUrl(existingPath) : null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        GestureDetector(
          onTap: () => _pickImage(field),
          child: Container(
            height: 80,
            width: 80,
            decoration: BoxDecoration(
              color: scheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(AppRadii.sm),
              image: bytes != null
                  ? DecorationImage(image: MemoryImage(bytes), fit: BoxFit.cover)
                  : existingUrl != null
                      ? DecorationImage(image: NetworkImage(existingUrl), fit: BoxFit.contain)
                      : null,
            ),
            child: (bytes == null && existingUrl == null)
                ? Center(child: Icon(Icons.add_photo_alternate_outlined, color: scheme.outline))
                : null,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final f = widget.existing;
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
            Text(_isEdit ? 'Edit Firm' : 'New Firm', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: AppSpacing.md),
            FormErrorBanner(_v.formError),
            _field('name', _nameCtrl, 'Firm name', max: kNameMax, caps: TextCapitalization.words),
            const SizedBox(height: AppSpacing.sm),
            _field('shopName', _shopNameCtrl, 'Shop name', max: kNameMax, caps: TextCapitalization.words),
            const SizedBox(height: AppSpacing.sm),
            _field('description', _descriptionCtrl, 'Firm description', max: kDescriptionMax, maxLines: 2),
            const SizedBox(height: AppSpacing.sm),
            _field('location', _locationCtrl, 'Location', max: kAddressMax),
            const SizedBox(height: AppSpacing.sm),
            _field('proprietor', _proprietorNameCtrl, 'Proprietor name (printed on invoices)',
                max: kNameMax, caps: TextCapitalization.words),
            const SizedBox(height: AppSpacing.sm),
            _field('address', _addressCtrl, 'Address', max: kAddressMax),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _field('city', _cityCtrl, 'City')),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _field('pincode', _pincodeCtrl, 'Pincode',
                      keyboard: TextInputType.number, formatters: digitsFormatters(6)),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            _field('registration', _registrationNoCtrl, 'Registration No.', max: 30),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _field('pan', _panNoCtrl, 'PAN No.', max: 10, caps: TextCapitalization.characters),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: InkWell(
                    onTap: _pickFirmStartDate,
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Firm start date'),
                      child: Text(
                        _firmStartDate == null
                            ? 'Not set'
                            : '${_firmStartDate!.day}/${_firmStartDate!.month}/${_firmStartDate!.year}',
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            _field('gst', _gstCtrl, 'GSTIN', max: 15, caps: TextCapitalization.characters),
            const SizedBox(height: AppSpacing.sm),
            _field('prefix', _invoicePrefixCtrl, 'Invoice prefix (e.g. IS)', max: 10, caps: TextCapitalization.characters),
            const SizedBox(height: AppSpacing.md),
            Text('GST Configuration', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _pct('cgst', _cgstCtrl, 'CGST %')),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: _pct('sgst', _sgstCtrl, 'SGST %')),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: _pct('igst', _igstCtrl, 'IGST %')),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            _field('email', _emailCtrl, 'Email', max: kEmailMax, keyboard: TextInputType.emailAddress),
            const SizedBox(height: AppSpacing.sm),
            _field('contact', _contactCtrl, 'Contact',
                keyboard: TextInputType.phone, formatters: phoneFormatters, helper: '10 digit mobile number'),
            const SizedBox(height: AppSpacing.md),
            Text('Bank Details', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            _field('bankName', _bankNameCtrl, 'Bank name'),
            const SizedBox(height: AppSpacing.sm),
            _field('branch', _branchCtrl, 'Branch'),
            const SizedBox(height: AppSpacing.sm),
            _field('accountNo', _accountNoCtrl, 'Account No.',
                keyboard: TextInputType.number, formatters: digitsFormatters(18)),
            const SizedBox(height: AppSpacing.sm),
            _field('ifsc', _ifscCodeCtrl, 'IFSC code', max: 11, caps: TextCapitalization.characters),
            const SizedBox(height: AppSpacing.md),
            Text('Branding (shown on invoices)', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.md,
              runSpacing: AppSpacing.md,
              children: [
                _imagePicker(_FirmImageField.logo, 'Logo', f?.logo),
                _imagePicker(_FirmImageField.firmStamp, 'Firm Stamp', f?.firmStamp),
                _imagePicker(_FirmImageField.ownerSignature, 'Owner Signature', f?.ownerSignature),
                _imagePicker(_FirmImageField.secondLogo, 'Second Logo / Hallmark', f?.secondLogo),
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
                  : Text(_isEdit ? 'Save Changes' : 'Create Firm'),
            ),
          ],
        ),
      ),
    );
  }
}
