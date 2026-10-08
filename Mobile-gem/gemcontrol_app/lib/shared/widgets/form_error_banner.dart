import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

/// A form-level error shown INSIDE the form (e.g. a server message that does
/// not belong to one field). Renders nothing when [message] is null.
class FormErrorBanner extends StatelessWidget {
  final String? message;
  const FormErrorBanner(this.message, {super.key});

  @override
  Widget build(BuildContext context) {
    final text = message;
    if (text == null) return const SizedBox.shrink();
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.sm + 2),
        decoration: BoxDecoration(
          color: scheme.errorContainer,
          borderRadius: BorderRadius.circular(AppRadii.sm),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.error_outline, size: 18, color: scheme.onErrorContainer),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(text, style: TextStyle(color: scheme.onErrorContainer, fontSize: 13)),
            ),
          ],
        ),
      ),
    );
  }
}
