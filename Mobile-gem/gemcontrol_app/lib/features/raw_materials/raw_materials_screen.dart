import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_client.dart';
import '../../core/models/raw_material.dart';
import '../../core/providers/firm_provider.dart';
import '../../core/repositories/raw_material_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'raw_materials_providers.dart';
import '../../shared/widgets/app_toast.dart';
import '../../shared/forms/live_validation.dart';
import '../../shared/forms/validators.dart';
import '../../shared/widgets/form_error_banner.dart';

class RawMaterialsScreen extends ConsumerWidget {
  const RawMaterialsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materialsAsync = ref.watch(rawMaterialsProvider);
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Raw Materials'),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
          ),
          builder: (_) => const _AddRawMaterialSheet(),
        ),
        child: const Icon(Icons.add),
      ),
      body: AsyncValueWidget<List<RawMaterial>>(
        value: materialsAsync,
        onRetry: () => ref.invalidate(rawMaterialsProvider),
        isEmpty: (d) => d.isEmpty,
        emptyWidget: const EmptyState(
          icon: Icons.diamond_outlined,
          message: 'No raw materials yet.\nTap + to add one.',
        ),
        data: (materials) => ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: materials.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) => _RawMaterialCard(material: materials[i]),
        ),
      ),
    );
  }
}

class _RawMaterialCard extends ConsumerWidget {
  final RawMaterial material;
  const _RawMaterialCard({required this.material});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm + 4),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadii.sm),
              child: SizedBox(
                width: 48,
                height: 48,
                child: material.rawMaterialImg.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: resolveUploadUrl(material.rawMaterialImg),
                        fit: BoxFit.cover,
                      )
                    : ColoredBox(
                        color: scheme.surfaceContainerHigh,
                        child: Icon(Icons.diamond_outlined, color: scheme.outline),
                      ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(material.name, style: Theme.of(context).textTheme.titleLarge),
                  Text(
                    '${material.rawMaterialCode} · ${material.materialType}',
                    style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            Text('${material.quantity.toStringAsFixed(2)}g', style: AppTheme.numericData(context)),
            IconButton(
              icon: Icon(Icons.add_circle_outline, color: scheme.primary),
              onPressed: () => _showAddStockDialog(context, ref, material),
            ),
            IconButton(
              icon: Icon(Icons.delete_outline, color: scheme.error),
              onPressed: () async {
                await ref.read(rawMaterialRepositoryProvider).removeRawMaterial(material.id);
                ref.invalidate(rawMaterialsProvider);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAddStockDialog(BuildContext context, WidgetRef ref, RawMaterial material) {
    final ctrl = TextEditingController();
    String? error;
    bool busy = false;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text('Add stock to ${material.name}'),
          content: TextField(
            controller: ctrl,
            autofocus: true,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            inputFormatters: decimalFormatters(decimals: 3, maxLength: 12),
            onChanged: (_) {
              if (error != null) setState(() => error = positiveNumberRule(ctrl.text, 'Quantity', max: 1000000));
            },
            decoration: InputDecoration(labelText: 'Quantity to add (grams)', errorText: error),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            TextButton(
              onPressed: busy
                  ? null
                  : () async {
                      final problem = positiveNumberRule(ctrl.text, 'Quantity', max: 1000000);
                      if (problem != null) {
                        setState(() => error = problem);
                        return;
                      }
                      setState(() => busy = true);
                      try {
                        await ref
                            .read(rawMaterialRepositoryProvider)
                            .addStock(material.id, double.parse(ctrl.text.trim()));
                        ref.invalidate(rawMaterialsProvider);
                        if (ctx.mounted) Navigator.pop(ctx);
                      } catch (e) {
                        if (ctx.mounted) {
                          setState(() {
                            busy = false;
                            error = e is ApiException ? e.message : 'Could not add stock. Try again.';
                          });
                        }
                      }
                    },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    ).whenComplete(ctrl.dispose);
  }
}

class _AddRawMaterialSheet extends ConsumerStatefulWidget {
  const _AddRawMaterialSheet();
  @override
  ConsumerState<_AddRawMaterialSheet> createState() => _AddRawMaterialSheetState();
}

class _AddRawMaterialSheetState extends ConsumerState<_AddRawMaterialSheet> {
  final _nameCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  String _materialType = 'gold';
  XFile? _image;
  bool _saving = false;

  // Field-level validation (see LiveValidation); same rules as the web form.
  late final LiveValidation _v = LiveValidation(_rules, () {
    if (mounted) setState(() {});
  });

  Map<String, String> _rules() => errorsOf({
    'name': nameRule(_nameCtrl.text, label: 'Material name'),
    'quantity': positiveNumberRule(_qtyCtrl.text, 'Quantity', max: 1000000),
  });

  String? _fieldForServerMessage(String message) {
    final m = message.toLowerCase();
    if (m.contains('name')) return 'name';
    if (m.contains('quantity')) return 'quantity';
    return null;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _image = img);
  }

  Future<void> _save() async {
    if (!_v.validateAll()) {
      AppToast.show(context, 'Please fix the highlighted fields.', type: AppToastType.warning);
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
    try {
      await ref.read(rawMaterialRepositoryProvider).createRawMaterial(
            name: _nameCtrl.text.trim(),
            materialType: _materialType,
            quantity: double.parse(_qtyCtrl.text.trim()),
            firmId: firm.id,
            imagePath: _image?.path,
          );
      ref.invalidate(rawMaterialsProvider);
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
    final scheme = Theme.of(context).colorScheme;
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
          Text('New Raw Material', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.md),
          FormErrorBanner(_v.formError),
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                color: scheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadii.sm),
                image: _image != null
                    ? DecorationImage(image: FileImage(File(_image!.path)), fit: BoxFit.cover)
                    : null,
              ),
              child: _image == null
                  ? Center(child: Icon(Icons.add_photo_alternate_outlined, color: scheme.outline))
                  : null,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _v.wrap(
            'name',
            TextField(
              controller: _nameCtrl,
              textCapitalization: TextCapitalization.words,
              inputFormatters: lengthLimit(kNameMax),
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(labelText: 'Name', errorText: _v.errorFor('name')),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<String>(
            initialValue: _materialType,
            decoration: const InputDecoration(labelText: 'Material type'),
            items: const ['gold', 'silver', 'platinum', 'diamond', 'other']
                .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                .toList(),
            onChanged: (v) => setState(() => _materialType = v!),
          ),
          const SizedBox(height: AppSpacing.sm),
          _v.wrap(
            'quantity',
            TextField(
              controller: _qtyCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: decimalFormatters(decimals: 3, maxLength: 12),
              onChanged: (_) => _v.changed(),
              decoration: InputDecoration(
                labelText: 'Initial quantity (grams)',
                errorText: _v.errorFor('quantity'),
              ),
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
                : const Text('Save'),
          ),
        ],
      ),
    );
  }
}
