import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/i18n/app_language.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_mode_provider.dart';

void main() {
  runApp(const ProviderScope(child: GemControlApp()));
}

class GemControlApp extends ConsumerWidget {
  const GemControlApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeControllerProvider);
    final language = ref.watch(languageControllerProvider);
    return MaterialApp.router(
      // Drives Flutter's own widgets (date picker, dialogs, tooltips) into the
      // chosen language; app text is translated by tr()/Text.
      locale: Locale(language.code),
      supportedLocales: [for (final l in AppLanguage.values) Locale(l.code)],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      title: 'RatnSetu',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
