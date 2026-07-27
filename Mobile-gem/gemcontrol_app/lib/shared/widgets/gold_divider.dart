import 'package:flutter/material.dart';

/// "Premium foil" divider: transparent -> gold -> transparent, per the
/// Stitch design system's divider spec.
class GoldDivider extends StatelessWidget {
  const GoldDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0x00C9A24B),
            Color(0x80C9A24B),
            Color(0x00C9A24B),
          ],
        ),
      ),
    );
  }
}
