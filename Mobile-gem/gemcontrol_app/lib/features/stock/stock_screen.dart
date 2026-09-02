import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/models/stock.dart';
import '../../core/repositories/stock_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import 'stock_form_sheet.dart';
import 'stock_providers.dart';

class StockScreen extends ConsumerStatefulWidget {
  const StockScreen({super.key});

  @override
  ConsumerState<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends ConsumerState<StockScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: materialTypes.length, vsync: this);
    _tabController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final stockAsync = ref.watch(stockListProvider);
    final activeType = materialTypes[_tabController.index];

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(
        title: 'Stock Management',
        showAppActions: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.category_outlined),
            tooltip: 'Categories',
            onPressed: () => context.push('/inventory/categories'),
          ),
          IconButton(
            icon: const Icon(Icons.diamond_outlined),
            tooltip: 'Raw Materials',
            onPressed: () => context.push('/inventory/raw-materials'),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          padding: EdgeInsets.zero,
          labelPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          tabs: [for (final t in materialTypes) Tab(text: materialTypeLabel(t))],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          useSafeArea: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
          ),
          builder: (_) => const StockFormSheet(),
        ),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: const InputDecoration(
                hintText: 'Search by name, code, karat...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: AsyncValueWidget<List<Stock>>(
              value: stockAsync,
              onRetry: () => ref.invalidate(stockListProvider),
              data: (all) {
                final filtered = all.where((s) {
                  final matchesType = activeType == 'All' || s.materialType == activeType;
                  final matchesQuery = _query.isEmpty ||
                      s.name.toLowerCase().contains(_query) ||
                      s.stockCode.toLowerCase().contains(_query) ||
                      s.karat.toLowerCase().contains(_query);
                  return matchesType && matchesQuery;
                }).toList();

                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.inventory_2_outlined,
                    message: 'No stock items match this filter.',
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md,
                    0,
                    AppSpacing.md,
                    AppSpacing.xl,
                  ),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, i) => _StockCard(stock: filtered[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _StockCard extends ConsumerWidget {
  final Stock stock;
  const _StockCard({required this.stock});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadii.card),
        onTap: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          useSafeArea: true,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
          ),
          builder: (_) => StockFormSheet(existing: stock),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
          child: Row(
            children: [
              Expanded(
                flex: 2,
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadii.sm),
                      child: SizedBox(
                        width: 48,
                        height: 48,
                        child: stock.stockImg.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: resolveUploadUrl(stock.stockImg),
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => const ColoredBox(
                                  color: AppColors.surfaceContainerHigh,
                                  child: Icon(Icons.diamond_outlined, color: AppColors.outline),
                                ),
                              )
                            : const ColoredBox(
                                color: AppColors.surfaceContainerHigh,
                                child: Icon(Icons.diamond_outlined, color: AppColors.outline),
                              ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Flexible(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            stock.name,
                            style: Theme.of(context).textTheme.titleLarge,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${stock.netWeight.toStringAsFixed(2)}g',
                            style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Text(
                  formatInr(stock.price, decimals: false),
                  textAlign: TextAlign.center,
                  style: AppTheme.numericData(context),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.error),
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Delete stock item?'),
                      content: Text('Remove "${stock.name}"?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await ref.read(stockRepositoryProvider).removeStock(stock.id);
                    ref.invalidate(stockListProvider);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
