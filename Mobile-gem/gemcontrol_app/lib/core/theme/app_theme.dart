import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Colors and type scale lifted from the Stitch "GemControl Mobile ERP"
/// design system (project 4119356669919397253) — "Haute Horlogerie &
/// Precious Metals": deep obsidian navy + sovereign gold in dark mode,
/// warm alabaster + antique gold in light mode. Outfit for headlines,
/// Hanken Grotesk for body/UI text, JetBrains Mono for all tabular
/// financial figures (weights, purity, currency).
///
/// All colors live on [ColorScheme] (via [AppTheme.light]/[AppTheme.dark])
/// or on [AppColorsExtension] for the semantic status-badge roles Material's
/// ColorScheme doesn't model. Nothing here is a compile-time constant
/// consumed directly by widgets — every screen must read colors via
/// `Theme.of(context)` so the light/dark toggle actually takes effect.
class AppRadii {
  AppRadii._();

  /// Buttons, inputs, scanner triggers.
  static const sm = 6.0;
  static const md = 10.0;

  /// Compact inventory tiles, rate tickers, list rows.
  static const tile = 6.0;

  /// Bottom-sheet top corners and larger elevated surfaces.
  static const card = 16.0;

  /// Non-pill status/purity badges.
  static const badge = 4.0;

  static const pill = 999.0;
}

class AppSpacing {
  AppSpacing._();
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;

  /// Stitch's own named spacing scale.
  static const edgeMobile = 16.0;
  static const edgeTablet = 24.0;
  static const gutterCompact = 8.0;
  static const gutterNormal = 12.0;
  static const cardPadH = 14.0;
  static const cardPadV = 12.0;
  static const dockHeight = 68.0;
  static const fabSize = 56.0;
}

/// Semantic status-badge colors the Stitch system documents as explicit
/// pairs for both modes (Hallmarked/In-Transit/In-Vault/Overdue), plus the
/// hairline "gold foil" divider accent. Not modeled by [ColorScheme].
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  final Color hairline;
  final Color successContainer;
  final Color onSuccessContainer;
  final Color transitContainer;
  final Color onTransitContainer;
  final Color vaultContainer;
  final Color onVaultContainer;
  final Color overdueContainer;
  final Color onOverdueContainer;

  const AppColorsExtension({
    required this.hairline,
    required this.successContainer,
    required this.onSuccessContainer,
    required this.transitContainer,
    required this.onTransitContainer,
    required this.vaultContainer,
    required this.onVaultContainer,
    required this.overdueContainer,
    required this.onOverdueContainer,
  });

  static const light = AppColorsExtension(
    hairline: Color(0x40C5A059),
    successContainer: Color(0xFFD1FAE5),
    onSuccessContainer: Color(0xFF059669),
    transitContainer: Color(0xFFFEF3C7),
    onTransitContainer: Color(0xFFD97706),
    vaultContainer: Color(0xFFDBEAFE),
    onVaultContainer: Color(0xFF2563EB),
    overdueContainer: Color(0xFFFEE2E2),
    onOverdueContainer: Color(0xFFDC2626),
  );

  static const dark = AppColorsExtension(
    hairline: Color(0x599A7B2C),
    successContainer: Color(0xFF064E3B),
    onSuccessContainer: Color(0xFF10B981),
    transitContainer: Color(0xFF78350F),
    onTransitContainer: Color(0xFFF59E0B),
    vaultContainer: Color(0xFF1E3A8A),
    onVaultContainer: Color(0xFF60A5FA),
    overdueContainer: Color(0xFF7F1D1D),
    onOverdueContainer: Color(0xFFEF4444),
  );

  @override
  AppColorsExtension copyWith({
    Color? hairline,
    Color? successContainer,
    Color? onSuccessContainer,
    Color? transitContainer,
    Color? onTransitContainer,
    Color? vaultContainer,
    Color? onVaultContainer,
    Color? overdueContainer,
    Color? onOverdueContainer,
  }) {
    return AppColorsExtension(
      hairline: hairline ?? this.hairline,
      successContainer: successContainer ?? this.successContainer,
      onSuccessContainer: onSuccessContainer ?? this.onSuccessContainer,
      transitContainer: transitContainer ?? this.transitContainer,
      onTransitContainer: onTransitContainer ?? this.onTransitContainer,
      vaultContainer: vaultContainer ?? this.vaultContainer,
      onVaultContainer: onVaultContainer ?? this.onVaultContainer,
      overdueContainer: overdueContainer ?? this.overdueContainer,
      onOverdueContainer: onOverdueContainer ?? this.onOverdueContainer,
    );
  }

  @override
  AppColorsExtension lerp(ThemeExtension<AppColorsExtension>? other, double t) {
    if (other is! AppColorsExtension) return this;
    return AppColorsExtension(
      hairline: Color.lerp(hairline, other.hairline, t)!,
      successContainer: Color.lerp(successContainer, other.successContainer, t)!,
      onSuccessContainer: Color.lerp(onSuccessContainer, other.onSuccessContainer, t)!,
      transitContainer: Color.lerp(transitContainer, other.transitContainer, t)!,
      onTransitContainer: Color.lerp(onTransitContainer, other.onTransitContainer, t)!,
      vaultContainer: Color.lerp(vaultContainer, other.vaultContainer, t)!,
      onVaultContainer: Color.lerp(onVaultContainer, other.onVaultContainer, t)!,
      overdueContainer: Color.lerp(overdueContainer, other.overdueContainer, t)!,
      onOverdueContainer: Color.lerp(onOverdueContainer, other.onOverdueContainer, t)!,
    );
  }
}

class AppTheme {
  AppTheme._();

  static const _lightScheme = ColorScheme.light(
    primary: Color(0xFF735C00),
    onPrimary: Color(0xFFFFFFFF),
    primaryContainer: Color(0xFFF3E5AB),
    onPrimaryContainer: Color(0xFF5B4000),
    secondary: Color(0xFF5F5847),
    onSecondary: Color(0xFFFFFFFF),
    secondaryContainer: Color(0xFFEAE4D2),
    onSecondaryContainer: Color(0xFF474030),
    tertiary: Color(0xFF5D4201),
    onTertiary: Color(0xFFFFFFFF),
    tertiaryContainer: Color(0xFFC5A059),
    onTertiaryContainer: Color(0xFF2A1D00),
    error: Color(0xFFBA1A1A),
    onError: Color(0xFFFFFFFF),
    errorContainer: Color(0xFFFFDAD6),
    onErrorContainer: Color(0xFF93000A),
    surface: Color(0xFFFBF9F4),
    onSurface: Color(0xFF2C3039),
    onSurfaceVariant: Color(0xFF5C5646),
    outline: Color(0xFF8A8065),
    outlineVariant: Color(0xFFE2DCB8),
    surfaceContainerLowest: Color(0xFFFFFFFF),
    surfaceContainerLow: Color(0xFFF8F5EC),
    surfaceContainer: Color(0xFFF1EDE0),
    surfaceContainerHigh: Color(0xFFEAE4D2),
    surfaceContainerHighest: Color(0xFFE2DCB8),
    surfaceDim: Color(0xFFE2DCB8),
    surfaceBright: Color(0xFFFFFFFF),
    inverseSurface: Color(0xFF2C3039),
    onInverseSurface: Color(0xFFDFE2EE),
    inversePrimary: Color(0xFFF2CA50),
  );

  static const _darkScheme = ColorScheme.dark(
    primary: Color(0xFFF2CA50),
    onPrimary: Color(0xFF3C2F00),
    primaryContainer: Color(0xFFD4AF37),
    onPrimaryContainer: Color(0xFF554300),
    secondary: Color(0xFFBFC7D8),
    onSecondary: Color(0xFF29313E),
    secondaryContainer: Color(0xFF3F4756),
    onSecondaryContainer: Color(0xFFADB5C7),
    tertiary: Color(0xFFF3E5AB),
    onTertiary: Color(0xFF412D00),
    tertiaryContainer: Color(0xFFC5A059),
    onTertiaryContainer: Color(0xFF2A1D00),
    error: Color(0xFFFFB4AB),
    onError: Color(0xFF690005),
    errorContainer: Color(0xFF93000A),
    onErrorContainer: Color(0xFFFFDAD6),
    surface: Color(0xFF151D2A),
    onSurface: Color(0xFFDFE2EE),
    onSurfaceVariant: Color(0xFFD0C5AF),
    outline: Color(0xFF99907C),
    outlineVariant: Color(0xFF9A7B2C),
    surfaceContainerLowest: Color(0xFF0A0E16),
    surfaceContainerLow: Color(0xFF181C24),
    surfaceContainer: Color(0xFF1C2028),
    surfaceContainerHigh: Color(0xFF1E293B),
    surfaceContainerHighest: Color(0xFF31353E),
    surfaceDim: Color(0xFF0F131C),
    surfaceBright: Color(0xFF353942),
    inverseSurface: Color(0xFFDFE2EE),
    onInverseSurface: Color(0xFF2C3039),
    inversePrimary: Color(0xFF735C00),
  );

  static TextTheme _textTheme(TextTheme base, ColorScheme scheme) {
    final body = GoogleFonts.hankenGroteskTextTheme(base).apply(
      bodyColor: scheme.onSurface,
      displayColor: scheme.onSurface,
    );
    return body.copyWith(
      displayLarge: GoogleFonts.outfit(
        textStyle: body.displayLarge,
        fontSize: 32,
        fontWeight: FontWeight.w600,
        height: 40 / 32,
        letterSpacing: -0.02 * 32,
      ),
      headlineMedium: GoogleFonts.outfit(
        textStyle: body.headlineMedium,
        fontSize: 22,
        fontWeight: FontWeight.w600,
        height: 28 / 22,
        letterSpacing: -0.01 * 22,
      ),
      headlineSmall: GoogleFonts.outfit(
        textStyle: body.headlineSmall,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        height: 24 / 18,
      ),
      titleLarge: GoogleFonts.outfit(
        textStyle: body.titleLarge,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: body.bodyLarge?.copyWith(fontSize: 16, height: 24 / 16),
      bodyMedium: body.bodyMedium?.copyWith(fontSize: 14, height: 20 / 14),
      labelMedium: body.labelMedium?.copyWith(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.04 * 11,
      ),
    );
  }

  /// Text style for currency / gram-weight / purity / SKU figures — always
  /// monospaced JetBrains Mono per the design system's "Tabular Financial
  /// Engine" rule, so digits never jitter during live rate refreshes.
  static TextStyle numericData(BuildContext context, {Color? color}) =>
      GoogleFonts.jetBrainsMono(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: color ?? Theme.of(context).colorScheme.onSurface,
      );

  static ThemeData light() => _build(_lightScheme, AppColorsExtension.light, const Color(0xFFF4F0E6));

  static ThemeData dark() => _build(_darkScheme, AppColorsExtension.dark, const Color(0xFF0B0F17));

  static ThemeData _build(ColorScheme scheme, AppColorsExtension extraColors, Color scaffoldBackground) {
    final base = ThemeData(useMaterial3: true, colorScheme: scheme, brightness: scheme.brightness);
    // Sovereign gold CTA fill + near-black ink are mode-invariant per the
    // design system's "Primary Sovereign Action" button spec.
    const ctaGold = Color(0xFFD4AF37);
    const ctaGoldInk = Color(0xFF0B0F17);

    return base.copyWith(
      scaffoldBackgroundColor: scaffoldBackground,
      extensions: [extraColors],
      textTheme: _textTheme(base.textTheme, scheme),
      appBarTheme: AppBarTheme(
        backgroundColor: scaffoldBackground,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: scheme.onSurface,
        ),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 1,
        shadowColor: Colors.black.withValues(alpha: scheme.brightness == Brightness.dark ? 0.45 : 0.12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.tile),
          side: BorderSide(color: extraColors.hairline, width: 0.5),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceContainerLow,
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
          borderSide: BorderSide(color: scheme.primary, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ctaGold,
          foregroundColor: ctaGoldInk,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.sm),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: scheme.onSurface,
          side: BorderSide(color: extraColors.hairline.withValues(alpha: 1)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.sm),
          ),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: ctaGold,
        foregroundColor: ctaGoldInk,
        shape: StadiumBorder(),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.secondaryContainer,
        labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: scheme.onSecondaryContainer),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      dividerTheme: DividerThemeData(
        color: extraColors.hairline,
        thickness: 1,
        space: 1,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scaffoldBackground.withValues(alpha: 0.92),
        indicatorColor: scheme.primaryContainer.withValues(alpha: 0.35),
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surfaceContainerHigh,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
        ),
      ),
    );
  }
}

/// Status-badge color pairs, e.g. "In Stock" / "Redeemed" / "Overdue".
/// Reads from the active [Theme] so it responds to the light/dark toggle.
class StatusColors {
  StatusColors._();

  static (Color bg, Color fg) forStatus(BuildContext context, String status) {
    final scheme = Theme.of(context).colorScheme;
    final extra = Theme.of(context).extension<AppColorsExtension>()!;
    switch (status.toLowerCase()) {
      case 'active':
      case 'in stock':
      case 'paid':
      case 'hallmarked':
      case 'certified':
        return (extra.successContainer, extra.onSuccessContainer);
      case 'redeemed':
        return (scheme.secondaryContainer, scheme.onSecondaryContainer);
      case 'in transit':
      case 'memo':
        return (extra.transitContainer, extra.onTransitContainer);
      case 'in vault':
      case 'custody':
        return (extra.vaultContainer, extra.onVaultContainer);
      case 'defaulted':
      case 'overdue':
        return (extra.overdueContainer, extra.onOverdueContainer);
      case 'pending':
      default:
        return (scheme.primaryContainer.withValues(alpha: 0.35), scheme.primary);
    }
  }
}
