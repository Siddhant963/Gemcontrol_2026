import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

/// The "RatnSetu — Smart Jewellery Business Management" brand banner
/// (assets/images/ratnsetu_banner.png, 2048x768). Keeps the image's own
/// aspect ratio at any width, with rounded corners to match the cards.
/// If the asset is ever missing it simply renders nothing instead of
/// breaking the screen it sits on.
class BrandBanner extends StatelessWidget {
  static const assetPath = 'assets/images/ratnsetu_banner.png';
  static const _aspectRatio = 2048 / 768;

  const BrandBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    // Decode no wider than the screen needs (the source is 2048px wide),
    // which keeps memory use low on small phones.
    final decodeWidth = (media.size.width * media.devicePixelRatio).round();

    return Semantics(
      image: true,
      label: 'RatnSetu, Smart Jewellery Business Management',
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadii.card),
        child: AspectRatio(
          aspectRatio: _aspectRatio,
          child: Image.asset(
            assetPath,
            fit: BoxFit.cover,
            cacheWidth: decodeWidth > 0 ? decodeWidth : null,
            filterQuality: FilterQuality.medium,
            excludeFromSemantics: true,
            errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }
}
