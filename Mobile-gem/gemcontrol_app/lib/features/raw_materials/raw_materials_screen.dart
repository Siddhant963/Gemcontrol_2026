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
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'raw_materials_providers.dart';

class RawMaterialsScreen extends ConsumerWidget {
  const RawMaterialsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materialsAsync = ref.watch(rawMaterialsProvider);
    return Scaffold(
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
                    : const ColoredBox(
                        color: AppColors.surfaceContainerHigh,
                        child: Icon(Icons.diamond_outlined, color: AppColors.outline),
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
                    style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            Text('${material.quantity.toStringAsFixed(2)}g', style: AppTheme.numericData(context)),
            IconButton(
              icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
              onPressed: () => _showAddStockDialog(context, ref, material),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppColors.error),
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
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Add stock to ${material.name}'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Quantity to add (grams)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final qty = double.tryParse(ctrl.text) ?? 0;
              if (qty > 0) {
                await ref.read(rawMaterialRepositoryProvider).addStock(material.id, qty);
                ref.invalidate(rawMaterialsProvider);
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}

class _AddRawMaterialSheet extends ConsumerStatefulWidget {
  const _AddRawMaterialSheet();
  @override
  ConsumerState<_AddRawMaterialSheet> createState() => _AddRawMaterialSheetState();
}

class _AddRawMaterialSheetState extends ConsumerState<_AddRawMaterialSheet> {
  final _nameCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController(text: '0');
  String _materialType = 'gold';
  XFile? _image;
  bool _saving = false;

  Future<void> _pickImage() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _image = img);
  }

  Future<void> _save() async {
    final firm = ref.read(currentFirmProvider);
    if (_nameCtrl.text.trim().isEmpty || firm == null) return;
    setState(() => _saving = true);
    try {
      await ref.read(rawMaterialRepositoryProvider).createRawMaterial(
            name: _nameCtrl.text.trim(),
            materialType: _materialType,
            quantity: double.tryParse(_qtyCtrl.text) ?? 0,
            firmId: firm.id,
            imagePath: _image?.path,
          );
      ref.invalidate(rawMaterialsProvider);
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
          Text('New Raw Material', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.md),
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              height: 100,
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
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
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
          TextField(
            controller: _qtyCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Initial quantity (grams)'),
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
