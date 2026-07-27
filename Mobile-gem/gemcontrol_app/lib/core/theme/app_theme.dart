import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Colors and type scale lifted from the Stitch "GemControl ERP UI" design
/// system (project 7189669442381491281) — "Boutique Banking": champagne gold
/// + charcoal, Bodoni Moda serif for headings/currency, Hanken Grotesk sans
/// for UI/data.
class AppColors {
  AppColors._();

  static const primary = Color(0xFF795902);
  static const onPrimary = Color(0xFFFFFFFF);
  static const primaryContainer = Color(0xFFC9A24B);
  static const onPrimaryContainer = Color(0xFF4F3900);

  static const secondary = Color(0xFF5F5E5E);
  static const onSecondary = Color(0xFFFFFFFF);
  static const secondaryContainer = Color(0xFFE2DFDE);
  static const onSecondaryContainer = Color(0xFF636262);

  static const tertiary = Color(0xFF5E5E5B);
  static const onTertiary = Color(0xFFFFFFFF);
  static const tertiaryContainer = Color(0xFFA8A7A3);

  static const error = Color(0xFFBA1A1A);
  static const onError = Color(0xFFFFFFFF);
  static const errorContainer = Color(0xFFFFDAD6);
  static const onErrorContainer = Color(0xFF93000A);

  static const background = Color(0xFFFBF9F9);
  static const onBackground = Color(0xFF1B1C1C);
  static const surface = Color(0xFFFBF9F9);
  static const onSurface = Color(0xFF1B1C1C);
  static const onSurfaceVariant = Color(0xFF4E4637);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFF5F3F3);
  static const surfaceContainer = Color(0xFFEFEDED);
  static const surfaceContainerHigh = Color(0xFFE9E8E7);
  static const surfaceContainerHighest = Color(0xFFE3E2E2);
  static const surfaceDim = Color(0xFFDBDAD9);

  static const outline = Color(0xFF7F7665);
  static const outlineVariant = Color(0xFFD1C5B2);

  static const success = Color(0xFF2E7D32);
  static const successContainer = Color(0xFFE3F3E4);

  /// 1px "gold foil" divider (transparent -> gold -> transparent), 30% opacity.
  static const goldFoil = Color(0x4DC9A24B);
}

class AppRadii {
  AppRadii._();
  static const sm = 8.0;
  static const md = 12.0;
  static const card = 16.0;
  static const pill = 999.0;
}

class AppSpacing {
  AppSpacing._();
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}

class AppTheme {
  AppTheme._();

  static TextTheme _textTheme(TextTheme base) {
    final serif = GoogleFonts.bodoniModaTextTheme(base);
    final sans = GoogleFonts.hankenGroteskTextTheme(base);
    return sans.copyWith(
      displayLarge: serif.displayLarge?.copyWith(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 40 / 32,
        letterSpacing: -0.02 * 32,
      ),
      headlineMedium: serif.headlineMedium?.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        height: 32 / 24,
      ),
      headlineSmall: serif.headlineSmall?.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w500,
        height: 28 / 20,
      ),
      titleLarge: serif.titleLarge?.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: sans.bodyLarge?.copyWith(fontSize: 16, height: 24 / 16),
      bodyMedium: sans.bodyMedium?.copyWith(fontSize: 14, height: 20 / 14),
      labelMedium: sans.labelMedium?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.6,
      ),
    );
  }

  /// Text style for currency / gram-weight / SKU figures — always the serif
  /// "numeric-data" style so financial figures read as substantial.
  static TextStyle numericData(BuildContext context) =>
      GoogleFonts.bodoniModa(fontSize: 18, fontWeight: FontWeight.w600);

  static ThemeData light() {
    final colorScheme = const ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      primaryContainer: AppColors.primaryContainer,
      onPrimaryContainer: AppColors.onPrimaryContainer,
      secondary: AppColors.secondary,
      onSecondary: AppColors.onSecondary,
      secondaryContainer: AppColors.secondaryContainer,
      onSecondaryContainer: AppColors.onSecondaryContainer,
      tertiary: AppColors.tertiary,
      onTertiary: AppColors.onTertiary,
      tertiaryContainer: AppColors.tertiaryContainer,
      error: AppColors.error,
      onError: AppColors.onError,
      errorContainer: AppColors.errorContainer,
      onErrorContainer: AppColors.onErrorContainer,
      surface: AppColors.surface,
      onSurface: AppColors.onSurface,
      onSurfaceVariant: AppColors.onSurfaceVariant,
      outline: AppColors.outline,
      outlineVariant: AppColors.outlineVariant,
      surfaceContainerLowest: AppColors.surfaceContainerLowest,
      surfaceContainerLow: AppColors.surfaceContainerLow,
      surfaceContainer: AppColors.surfaceContainer,
      surfaceContainerHigh: AppColors.surfaceContainerHigh,
      surfaceContainerHighest: AppColors.surfaceContainerHighest,
      surfaceDim: AppColors.surfaceDim,
    );

    final base = ThemeData(useMaterial3: true, colorScheme: colorScheme);

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      textTheme: _textTheme(base.textTheme),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.onBackground,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.bodoniModa(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AppColors.onBackground,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceContainerLowest,
        elevation: 1,
        shadowColor: AppColors.primary.withValues(alpha: 0.15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.card),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceContainerLow,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm + 4,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.sm),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.sm),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.sm),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.sm),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.sm),
          ),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        shape: StadiumBorder(),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.secondaryContainer,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.goldFoil,
        thickness: 1,
        space: 1,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.background.withValues(alpha: 0.92),
        indicatorColor: AppColors.primaryContainer.withValues(alpha: 0.35),
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

/// Status-chip color pairs, e.g. "In Stock" / "Sold" / "Active" / "Redeemed".
class StatusColors {
  StatusColors._();

  static (Color bg, Color fg) forStatus(String status) {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in stock':
      case 'paid':
        return (AppColors.successContainer, AppColors.success);
      case 'redeemed':
        return (AppColors.secondaryContainer, AppColors.secondary);
      case 'defaulted':
      case 'overdue':
        return (AppColors.errorContainer, AppColors.error);
      case 'pending':
      default:
        return (
          AppColors.primaryContainer.withValues(alpha: 0.35),
          AppColors.primary,
        );
    }
  }
}
