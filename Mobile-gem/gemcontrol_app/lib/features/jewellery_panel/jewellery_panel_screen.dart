import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/stock.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../categories/categories_providers.dart';
import '../stock/stock_providers.dart';

/// Catalog-style browsing grid, grouped by category — for showing customers
/// what's in stock, not for editing (that's Stock Management).
class JewelleryPanelScreen extends ConsumerWidget {
  const JewelleryPanelScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockAsync = ref.watch(stockListProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Jewellery Panel'),
      body: AsyncValueWidget<List<Stock>>(
        value: stockAsync,
        onRetry: () => ref.invalidate(stockListProvider),
        isEmpty: (d) => d.isEmpty,
        emptyWidget: const EmptyState(icon: Icons.diamond_outlined, message: 'No items to showcase yet.'),
        data: (stocks) {
          final categoryNames = categoriesAsync.valueOrNull ?? [];
          final byCategory = <String, List<Stock>>{};
          for (final s in stocks) {
            String? name = s.categoryName;
            if (name == null) {
              for (final c in categoryNames) {
                if (c.id == s.categoryId) {
                  name = c.name;
                  break;
                }
              }
            }
            byCategory.putIfAbsent(name ?? 'Uncategorized', () => []).add(s);
          }
          final entries = byCategory.entries.toList();
          return ListView.builder(
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: entries.length,
            itemBuilder: (context, i) {
              final entry = entries[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.key, style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: AppSpacing.sm),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: entry.value.length,
                      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, j) {
                        final s = entry.value[j];
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
                                    child: s.stockImg.isNotEmpty
                                        ? CachedNetworkImage(imageUrl: resolveUploadUrl(s.stockImg), fit: BoxFit.cover)
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
                                      Text(
                                        s.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(context).textTheme.titleLarge,
                                      ),
                                      Text(
                                        '${s.netWeight.toStringAsFixed(2)}g',
                                        style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(formatInr(s.price, decimals: false), style: AppTheme.numericData(context)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
