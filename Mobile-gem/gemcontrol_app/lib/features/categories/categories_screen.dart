import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/api/api_client.dart';
import '../../core/models/stock_category.dart';
import '../../core/repositories/stock_category_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'categories_providers.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    return Scaffold(
      appBar: GcAppBar(title: 'Categories'),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddSheet(context, ref),
        child: const Icon(Icons.add),
      ),
      body: AsyncValueWidget<List<StockCategory>>(
        value: categoriesAsync,
        onRetry: () => ref.invalidate(categoriesProvider),
        isEmpty: (d) => d.isEmpty,
        emptyWidget: const EmptyState(
          icon: Icons.category_outlined,
          message: 'No categories yet.\nTap + to add one.',
        ),
        data: (categories) => GridView.builder(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: categories.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: AppSpacing.sm,
            crossAxisSpacing: AppSpacing.sm,
            childAspectRatio: 1.1,
          ),
          itemBuilder: (context, i) {
            final c = categories[i];
            return _CategoryCard(
              category: c,
              onDelete: () async {
                await ref
                    .read(stockCategoryRepositoryProvider)
                    .removeCategory(c.id);
                ref.invalidate(categoriesProvider);
              },
            );
          },
        ),
      ),
    );
  }

  void _showAddSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
      ),
      builder: (_) => const _AddCategorySheet(),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final StockCategory category;
  final VoidCallback onDelete;
  const _CategoryCard({required this.category, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: category.categoryImg.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: resolveUploadUrl(category.categoryImg),
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => const _CategoryPlaceholder(),
                      )
                    : const _CategoryPlaceholder(),
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Text(
                  category.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          Positioned(
            right: 2,
            top: 2,
            child: IconButton(
              icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
              onPressed: () => showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Delete category?'),
                  content: Text('Remove "${category.name}"?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        onDelete();
                      },
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryPlaceholder extends StatelessWidget {
  const _CategoryPlaceholder();
  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: AppColors.surfaceContainerHigh,
    child: Icon(Icons.diamond_outlined, color: AppColors.outline),
  );
}

class _AddCategorySheet extends ConsumerStatefulWidget {
  const _AddCategorySheet();
  @override
  ConsumerState<_AddCategorySheet> createState() => _AddCategorySheetState();
}

class _AddCategorySheetState extends ConsumerState<_AddCategorySheet> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  XFile? _image;
  bool _saving = false;

  Future<void> _pickImage() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _image = img);
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref.read(stockCategoryRepositoryProvider).createCategory(
            name: _nameCtrl.text.trim(),
            description: _descCtrl.text.trim(),
            imagePath: _image?.path,
          );
      ref.invalidate(categoriesProvider);
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
          Text('New Category', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.md),
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadii.sm),
                image: _image != null
                    ? DecorationImage(
                        image: FileImage(File(_image!.path)),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: _image == null
                  ? const Center(
                      child: Icon(Icons.add_photo_alternate_outlined, color: AppColors.outline),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(labelText: 'Category name'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _descCtrl,
            decoration: const InputDecoration(labelText: 'Description'),
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
                : const Text('Save Category'),
          ),
        ],
      ),
    );
  }
}
