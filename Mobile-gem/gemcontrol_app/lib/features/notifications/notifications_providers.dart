import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/models/activity.dart';
import '../../core/repositories/dashboard_repository.dart';

const _lastSeenKey = 'gc_last_seen_activity_ts';
const _pollInterval = Duration(seconds: 30);

class NotificationsState {
  final List<ActivityItem> activities;
  final DateTime? lastSeenTs;

  const NotificationsState({this.activities = const [], this.lastSeenTs});

  int get unreadCount => activities
      .where(
        (a) =>
            a.timestamp != null &&
            (lastSeenTs == null || a.timestamp!.isAfter(lastSeenTs!)),
      )
      .length;

  NotificationsState copyWith({
    List<ActivityItem>? activities,
    DateTime? lastSeenTs,
  }) => NotificationsState(
    activities: activities ?? this.activities,
    lastSeenTs: lastSeenTs ?? this.lastSeenTs,
  );
}

/// Polls recent activities for the shared notification bell shown on the
/// primary tab screens. Kept alive for the app session (not autoDispose) so
/// the unread badge stays accurate in the background across screens.
class NotificationsController extends StateNotifier<NotificationsState> {
  final Ref ref;
  Timer? _timer;

  NotificationsController(this.ref) : super(const NotificationsState()) {
    _init();
  }

  Future<void> _init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString(_lastSeenKey);
      if (stored != null) {
        state = state.copyWith(lastSeenTs: DateTime.tryParse(stored));
      }
    } catch (_) {
      // Non-critical — proceed without a persisted last-seen marker.
    }
    await refresh();
    _timer = Timer.periodic(_pollInterval, (_) => refresh());
  }

  Future<void> refresh() async {
    try {
      final activities = await ref.read(dashboardRepositoryProvider).getRecentActivities();
      activities.sort((a, b) {
        final at = a.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bt = b.timestamp ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bt.compareTo(at);
      });
      state = state.copyWith(activities: activities);
    } catch (_) {
      // Notifications are non-critical; fail silently and try again on the
      // next poll tick.
    }
  }

  Future<void> markAllRead() async {
    if (state.activities.isEmpty) return;
    final newest = state.activities.first.timestamp;
    if (newest == null) return;
    state = state.copyWith(lastSeenTs: newest);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_lastSeenKey, newest.toIso8601String());
    } catch (_) {
      // Best-effort persistence; the in-memory state above already updated.
    }
  }

  /// Fetches the latest activities and immediately marks them read — used
  /// when the user opens the full notifications screen.
  Future<void> refreshAndMarkRead() async {
    await refresh();
    await markAllRead();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final notificationsControllerProvider =
    StateNotifierProvider<NotificationsController, NotificationsState>((ref) {
      return NotificationsController(ref);
    });
