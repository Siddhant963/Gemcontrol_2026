import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/girvi.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/async_value_widget.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/status_chip.dart';
import 'add_girvi_sheet.dart';
import 'girvi_detail_sheet.dart';
import 'girvi_providers.dart';

class GirviScreen extends ConsumerWidget {
  const GirviScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itemsAsync = ref.watch(girviItemsProvider);
    final summaryAsync = ref.watch(girviSummaryProvider);

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: GcAppBar(title: 'Girvi Management'),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          useSafeArea: true,
          builder: (_) => const AddGirviSheet(),
        ),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(girviItemsProvider);
          ref.invalidate(girviSummaryProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            summaryAsync.maybeWhen(
              data: (rows) => rows.isEmpty
                  ? const SizedBox()
                  : SizedBox(
                      height: 90,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: rows.length,
                        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
                        itemBuilder: (context, i) {
                          final r = rows[i];
                          return Card(
                            child: Container(
                              width: 150,
                              padding: const EdgeInsets.all(AppSpacing.sm + 4),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  StatusChip(label: r.status),
                                  Text('${r.count} items', style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
                                  Text(formatInr(r.totalOutstanding, decimals: false), style: AppTheme.numericData(context)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
              orElse: () => const SizedBox(),
            ),
            const SizedBox(height: AppSpacing.md),
            AsyncValueWidget<List<Girvi>>(
              value: itemsAsync,
              onRetry: () => ref.invalidate(girviItemsProvider),
              isEmpty: (d) => d.isEmpty,
              emptyWidget: const EmptyState(
                icon: Icons.diamond_outlined,
                message: 'No girvi (pledge) items yet.\nTap + to add one.',
              ),
              data: (items) => Column(
                children: [
                  for (final g in items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: _GirviCard(girvi: g),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GirviCard extends StatelessWidget {
  final Girvi girvi;
  const _GirviCard({required this.girvi});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadii.card),
        onTap: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          useSafeArea: true,
          builder: (_) => GirviDetailSheet(girvi: girvi),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm + 4),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadii.sm),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: girvi.itemImage.isNotEmpty
                      ? CachedNetworkImage(imageUrl: resolveUploadUrl(girvi.itemImage), fit: BoxFit.cover)
                      : const ColoredBox(
                          color: AppColors.surfaceContainerHigh,
                          child: Icon(Icons.diamond_outlined, color: AppColors.outline),
                        ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm + 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(girvi.itemName, style: Theme.of(context).textTheme.titleLarge),
                    Text(
                      girvi.customerName ?? '-',
                      style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                    ),
                    Text(
                      'Due ${formatDate(girvi.lastDateToTake)}',
                      style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(formatInr(girvi.currentOutstandingAmount, decimals: false), style: AppTheme.numericData(context)),
                  const SizedBox(height: 4),
                  StatusChip(label: girvi.status),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
