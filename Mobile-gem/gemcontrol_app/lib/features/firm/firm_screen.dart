import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_client.dart';
import '../../core/models/firm.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/firm_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';

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
    if (_nameCtrl.text.trim().isEmpty) return;
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
      'panNo': _panNoCtrl.text.trim(),
      'gst': _gstCtrl.text.trim(),
      'invoicePrefix': _invoicePrefixCtrl.text.trim(),
      'cgstRate': double.tryParse(_cgstCtrl.text) ?? 1.5,
      'sgstRate': double.tryParse(_sgstCtrl.text) ?? 1.5,
      'igstRate': double.tryParse(_igstCtrl.text) ?? 0,
      'gstEnabled': true,
      'email': _emailCtrl.text.trim(),
      'contact': _contactCtrl.text.trim(),
      'bankName': _bankNameCtrl.text.trim(),
      'branch': _branchCtrl.text.trim(),
      'accountNo': _accountNoCtrl.text.trim(),
      'ifscCode': _ifscCodeCtrl.text.trim(),
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
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not save: $e')));
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
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Firm name')),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _shopNameCtrl, decoration: const InputDecoration(labelText: 'Shop name')),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: _descriptionCtrl,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Firm description'),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _locationCtrl, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: _proprietorNameCtrl,
              decoration: const InputDecoration(labelText: 'Proprietor name (printed on invoices)'),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _addressCtrl, decoration: const InputDecoration(labelText: 'Address')),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(child: TextField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City'))),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: TextField(controller: _pincodeCtrl, decoration: const InputDecoration(labelText: 'Pincode'))),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: _registrationNoCtrl,
              decoration: const InputDecoration(labelText: 'Registration No.'),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(child: TextField(controller: _panNoCtrl, decoration: const InputDecoration(labelText: 'PAN No.'))),
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
            TextField(controller: _gstCtrl, decoration: const InputDecoration(labelText: 'GSTIN')),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: _invoicePrefixCtrl,
              decoration: const InputDecoration(labelText: 'Invoice prefix (e.g. IS)'),
            ),
            const SizedBox(height: AppSpacing.md),
            Text('GST Configuration', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _cgstCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'CGST %'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _sgstCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'SGST %'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _igstCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'IGST %'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(child: TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email'))),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: TextField(controller: _contactCtrl, decoration: const InputDecoration(labelText: 'Contact'))),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text('Bank Details', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _bankNameCtrl, decoration: const InputDecoration(labelText: 'Bank name')),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _branchCtrl, decoration: const InputDecoration(labelText: 'Branch')),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _accountNoCtrl, decoration: const InputDecoration(labelText: 'Account No.')),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _ifscCodeCtrl, decoration: const InputDecoration(labelText: 'IFSC code')),
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
