import 'dart:io';

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
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Firm Management'),
      floatingActionButton: FloatingActionButton(
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
                trailing: IconButton(
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    useSafeArea: true,
                    builder: (_) => _FirmFormSheet(existing: f),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _FirmFormSheet extends ConsumerStatefulWidget {
  final Firm? existing;
  const _FirmFormSheet({this.existing});

  @override
  ConsumerState<_FirmFormSheet> createState() => _FirmFormSheetState();
}

class _FirmFormSheetState extends ConsumerState<_FirmFormSheet> {
  final _nameCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _gstCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cgstCtrl = TextEditingController(text: '1.5');
  final _sgstCtrl = TextEditingController(text: '1.5');
  final _igstCtrl = TextEditingController(text: '0');
  XFile? _logo;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final f = widget.existing;
    if (f != null) {
      _nameCtrl.text = f.name;
      _locationCtrl.text = f.location;
      _gstCtrl.text = f.gst;
      _emailCtrl.text = f.email;
      _contactCtrl.text = f.contact;
      _addressCtrl.text = f.address;
      _cgstCtrl.text = f.gstConfig.cgstRate.toString();
      _sgstCtrl.text = f.gstConfig.sgstRate.toString();
      _igstCtrl.text = f.gstConfig.igstRate.toString();
    }
  }

  Future<void> _pickLogo() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _logo = img);
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    final fields = {
      'name': _nameCtrl.text.trim(),
      'location': _locationCtrl.text.trim(),
      'size': 1,
      'gst': _gstCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'contact': _contactCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
      'cgstRate': double.tryParse(_cgstCtrl.text) ?? 1.5,
      'sgstRate': double.tryParse(_sgstCtrl.text) ?? 1.5,
      'igstRate': double.tryParse(_igstCtrl.text) ?? 0,
      'gstEnabled': true,
    };
    try {
      final repo = ref.read(firmRepositoryProvider);
      if (_isEdit) {
        await repo.updateFirm(widget.existing!.id, fields, logoPath: _logo?.path);
      } else {
        await repo.createFirm(fields, logoPath: _logo?.path);
      }
      ref.invalidate(firmsProvider);
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
            GestureDetector(
              onTap: _pickLogo,
              child: Container(
                height: 90,
                width: 90,
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(AppRadii.sm),
                  image: _logo != null
                      ? DecorationImage(image: FileImage(File(_logo!.path)), fit: BoxFit.cover)
                      : null,
                ),
                child: _logo == null
                    ? const Center(child: Icon(Icons.add_photo_alternate_outlined, color: AppColors.outline))
                    : null,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Firm name')),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _locationCtrl, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _addressCtrl, decoration: const InputDecoration(labelText: 'Address')),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: _gstCtrl, decoration: const InputDecoration(labelText: 'GSTIN')),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(child: TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email'))),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: TextField(controller: _contactCtrl, decoration: const InputDecoration(labelText: 'Contact'))),
              ],
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
