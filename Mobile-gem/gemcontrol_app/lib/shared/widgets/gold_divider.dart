import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

/// "Premium foil" divider: transparent -> gold -> transparent, per the
/// Stitch design system's divider spec.
class GoldDivider extends StatelessWidget {
  const GoldDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final hairline = Theme.of(context).extension<AppColorsExtension>()!.hairline;
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            hairline.withValues(alpha: 0),
            hairline,
            hairline.withValues(alpha: 0),
          ],
        ),
      ),
    );
  }
}
