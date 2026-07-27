import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/stock.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/async_value_widget.dart';
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
      appBar: AppBar(title: const Text('Jewellery Panel')),
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
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: entry.value.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: AppSpacing.sm,
                        crossAxisSpacing: AppSpacing.sm,
                        childAspectRatio: 0.85,
                      ),
                      itemBuilder: (context, j) {
                        final s = entry.value[j];
                        return Card(
                          clipBehavior: Clip.antiAlias,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Expanded(
                                child: s.stockImg.isNotEmpty
                                    ? CachedNetworkImage(imageUrl: resolveUploadUrl(s.stockImg), fit: BoxFit.cover)
                                    : const ColoredBox(
                                        color: AppColors.surfaceContainerHigh,
                                        child: Icon(Icons.diamond_outlined, color: AppColors.outline, size: 32),
                                      ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(s.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                    Text('${s.netWeight.toStringAsFixed(2)}g', style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                                    Text(formatInr(s.price, decimals: false), style: AppTheme.numericData(context).copyWith(fontSize: 14)),
                                  ],
                                ),
                              ),
                            ],
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
