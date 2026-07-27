import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/raw_material.dart';
import '../../core/models/sale.dart';
import '../../core/models/stock.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../raw_materials/raw_materials_providers.dart';
import '../stock/stock_providers.dart';

/// Bottom sheet to pick a Stock or RawMaterial item to add to the sale cart.
/// Returns a SaleItem (with quantity=1, amount=price) via Navigator.pop, or
/// null if dismissed.
class ItemPickerSheet extends ConsumerStatefulWidget {
  const ItemPickerSheet({super.key});

  @override
  ConsumerState<ItemPickerSheet> createState() => _ItemPickerSheetState();
}

class _ItemPickerSheetState extends ConsumerState<ItemPickerSheet>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Column(
        children: [
          const SizedBox(height: AppSpacing.sm),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          TabBar(
            controller: _tabController,
            tabs: const [Tab(text: 'Stock'), Tab(text: 'Raw Material')],
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: TextField(
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: const InputDecoration(
                hintText: 'Search...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _StockList(query: _query, scrollController: scrollController),
                _RawMaterialList(query: _query, scrollController: scrollController),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StockList extends ConsumerWidget {
  final String query;
  final ScrollController scrollController;
  const _StockList({required this.query, required this.scrollController});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockAsync = ref.watch(stockListProvider);
    return AsyncValueWidget<List<Stock>>(
      value: stockAsync,
      data: (all) {
        final filtered = query.isEmpty
            ? all
            : all
                .where((s) =>
                    s.name.toLowerCase().contains(query) ||
                    s.stockCode.toLowerCase().contains(query))
                .toList();
        if (filtered.isEmpty) {
          return const EmptyState(icon: Icons.inventory_2_outlined, message: 'No stock found.');
        }
        return ListView.builder(
          controller: scrollController,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          itemCount: filtered.length,
          itemBuilder: (context, i) {
            final s = filtered[i];
            return ListTile(
              title: Text(s.name),
              subtitle: Text('${s.stockCode} · Qty ${s.quantity.toStringAsFixed(0)}'),
              trailing: Text(formatInr(s.price, decimals: false)),
              onTap: () => Navigator.pop(
                context,
                SaleItem(
                  saleType: 'stock',
                  materialId: s.id,
                  quantity: 1,
                  amount: s.price,
                  name: s.name,
                  hsnCode: s.hsnCode,
                  karat: s.karat,
                  grossWeight: s.grossWeight,
                  lessWeight: s.lessWeight,
                  netWeight: s.netWeight,
                  rate: s.price,
                  makingCharge: s.makingCharge,
                  wastageAmount: 0,
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _RawMaterialList extends ConsumerWidget {
  final String query;
  final ScrollController scrollController;
  const _RawMaterialList({required this.query, required this.scrollController});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materialsAsync = ref.watch(rawMaterialsProvider);
    return AsyncValueWidget<List<RawMaterial>>(
      value: materialsAsync,
      data: (all) {
        final filtered = query.isEmpty
            ? all
            : all.where((m) => m.name.toLowerCase().contains(query)).toList();
        if (filtered.isEmpty) {
          return const EmptyState(icon: Icons.diamond_outlined, message: 'No raw materials found.');
        }
        return ListView.builder(
          controller: scrollController,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          itemCount: filtered.length,
          itemBuilder: (context, i) {
            final m = filtered[i];
            return ListTile(
              title: Text(m.name),
              subtitle: Text('${m.rawMaterialCode} · ${m.quantity.toStringAsFixed(2)}g available'),
              trailing: Text(formatInr(m.price, decimals: false)),
              onTap: () => Navigator.pop(
                context,
                SaleItem(
                  saleType: 'rawMaterial',
                  materialId: m.id,
                  quantity: 1,
                  amount: m.price,
                  name: m.name,
                  hsnCode: '',
                  karat: '',
                  grossWeight: m.weight,
                  lessWeight: 0,
                  netWeight: m.weight,
                  rate: m.price,
                  makingCharge: 0,
                  wastageAmount: 0,
                ),
              ),
            );
          },
        );
      },
    );
  }
}
