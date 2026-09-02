import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/notifications/notifications_providers.dart';

/// Standard top app bar for every authenticated screen: the GemControl
/// logo mark next to the screen title, so the brand stays visible
/// throughout the app the way it does on the website's sidebar.
///
/// Pass [showAppActions] on the 5 primary tab screens (Dashboard, Stock,
/// Sales History, Customers, Reports) to add the shared notifications bell
/// and settings shortcut next to the hamburger (drawer) that opens
/// automatically once those screens' Scaffold has a `drawer`. Pushed detail
/// screens keep the plain back-button bar.
class GcAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final PreferredSizeWidget? bottom;
  final bool showAppActions;

  const GcAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.bottom,
    this.showAppActions = false,
  });

  @override
  Size get preferredSize =>
      Size.fromHeight(kToolbarHeight + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadCount = showAppActions
        ? ref.watch(notificationsControllerProvider.select((s) => s.unreadCount))
        : 0;

    return AppBar(
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.asset(
              'assets/images/logo.png',
              width: 26,
              height: 26,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 10),
          Flexible(child: Text(title, overflow: TextOverflow.ellipsis)),
        ],
      ),
      actions: [
        if (showAppActions) ...[
          IconButton(
            tooltip: 'Notifications',
            onPressed: () => context.push('/notifications'),
            icon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text('$unreadCount'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
          IconButton(
            tooltip: 'Settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
        ...?actions,
      ],
      bottom: bottom,
    );
  }
}
