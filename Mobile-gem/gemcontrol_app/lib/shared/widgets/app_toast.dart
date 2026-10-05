import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

enum AppToastType { success, error, warning, info }

/// ONE global notification for the app, shown at the TOP of the screen.
///
/// It is inserted into the root [Overlay], so it sits above every route:
/// pages, dialogs and modal bottom sheets alike (a plain SnackBar is drawn by
/// a Scaffold at the bottom and can end up behind a sheet or the keyboard).
/// [SafeArea] keeps it clear of the status bar / notch. One toast at a time:
/// a new one replaces the current one.
class AppToast {
  AppToast._();

  static OverlayEntry? _entry;
  static Timer? _timer;

  static void show(
    BuildContext context,
    String message, {
    AppToastType type = AppToastType.info,
    Duration? duration,
  }) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;
    dismiss();

    late final OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) => _ToastView(
        message: message,
        type: type,
        onDismiss: () => _remove(entry),
      ),
    );
    _entry = entry;
    overlay.insert(entry);
    _timer = Timer(
      duration ?? (type == AppToastType.error ? const Duration(seconds: 5) : const Duration(seconds: 3)),
      () => _remove(entry),
    );
  }

  static void dismiss() {
    _timer?.cancel();
    _timer = null;
    _entry?.remove();
    _entry = null;
  }

  static void _remove(OverlayEntry entry) {
    if (_entry == entry) {
      _timer?.cancel();
      _timer = null;
      _entry = null;
    }
    if (entry.mounted) entry.remove();
  }
}

class _ToastView extends StatelessWidget {
  final String message;
  final AppToastType type;
  final VoidCallback onDismiss;

  const _ToastView({required this.message, required this.type, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final extra = Theme.of(context).extension<AppColorsExtension>();
    final (Color bg, Color fg, IconData icon) = switch (type) {
      AppToastType.success => (
        extra?.successContainer ?? scheme.secondaryContainer,
        extra?.onSuccessContainer ?? scheme.onSecondaryContainer,
        Icons.check_circle_outline,
      ),
      AppToastType.error => (scheme.errorContainer, scheme.onErrorContainer, Icons.error_outline),
      AppToastType.warning => (
        extra?.transitContainer ?? scheme.tertiaryContainer,
        extra?.onTransitContainer ?? scheme.onTertiaryContainer,
        Icons.warning_amber_rounded,
      ),
      AppToastType.info => (scheme.inverseSurface, scheme.onInverseSurface, Icons.info_outline),
    };

    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        minimum: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            // Never wider than the screen minus the gutters (SafeArea/minimum
            // already inset it); long messages wrap instead of overflowing.
            constraints: const BoxConstraints(maxWidth: 520),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOut,
              builder: (context, t, child) => Opacity(
                opacity: t,
                child: Transform.translate(offset: Offset(0, (1 - t) * -12), child: child),
              ),
              child: GestureDetector(
                // Swipe up to dismiss.
                onVerticalDragEnd: (d) {
                  if ((d.primaryVelocity ?? 0) < -150) onDismiss();
                },
                child: Semantics(
                  liveRegion: true,
                  container: true,
                  child: Material(
                    color: bg,
                    elevation: 6,
                    borderRadius: BorderRadius.circular(AppRadii.md),
                    child: Padding(
                      padding: const EdgeInsets.only(left: 12, top: 4, bottom: 4, right: 0),
                      child: Row(
                        children: [
                          Icon(icon, color: fg, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Text(message, style: TextStyle(color: fg, fontSize: 14)),
                            ),
                          ),
                          IconButton(
                            tooltip: 'Dismiss',
                            visualDensity: VisualDensity.compact,
                            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                            icon: Icon(Icons.close, color: fg, size: 18),
                            onPressed: onDismiss,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
