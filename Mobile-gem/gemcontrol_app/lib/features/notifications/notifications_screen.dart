import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/currency.dart';
import '../../shared/widgets/gc_app_bar.dart';
import '../../shared/widgets/gold_divider.dart';
import 'notifications_providers.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    // Opening this screen is the "read" action — fetch fresh activity and
    // clear the bell badge.
    Future.microtask(
      () => ref.read(notificationsControllerProvider.notifier).refreshAndMarkRead(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsControllerProvider);

    return Scaffold(
      appBar: GcAppBar(title: 'Notifications'),
      body: RefreshIndicator(
        onRefresh: () => ref.read(notificationsControllerProvider.notifier).refreshAndMarkRead(),
        child: state.activities.isEmpty
            ? ListView(
                children: const [
                  Padding(
                    padding: EdgeInsets.only(top: 96),
                    child: Center(
                      child: Text(
                        'No recent activity',
                        style: TextStyle(color: AppColors.onSurfaceVariant),
                      ),
                    ),
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: state.activities.length,
                separatorBuilder: (_, __) => const GoldDivider(),
                itemBuilder: (context, i) {
                  final activity = state.activities[i];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.circle, size: 10, color: AppColors.primary),
                    title: Text('${activity.activityType}: ${activity.description}'),
                    subtitle: Text(formatDateTime(activity.timestamp)),
                  );
                },
              ),
      ),
    );
  }
}
