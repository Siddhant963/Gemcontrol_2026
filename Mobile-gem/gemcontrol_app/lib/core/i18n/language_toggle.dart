import 'package:flutter/material.dart' hide Text;
import 'package:flutter/material.dart' as m show Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_language.dart';
import 'tr_text.dart';

/// EN | हिं switch. Compact so it fits on the login/register screens as well
/// as inside the Settings card.
class LanguageToggle extends ConsumerWidget {
  const LanguageToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language = ref.watch(languageControllerProvider);
    return SegmentedButton<AppLanguage>(
      showSelectedIcon: false,
      style: const ButtonStyle(
        visualDensity: VisualDensity.compact,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      segments: [
        for (final l in AppLanguage.values)
          ButtonSegment<AppLanguage>(
            value: l,
            // Language names are shown in their own script and never translated.
            label: m.Text(l.short, semanticsLabel: l.label),
          ),
      ],
      selected: {language},
      onSelectionChanged: (selection) =>
          ref.read(languageControllerProvider.notifier).setLanguage(selection.first),
    );
  }
}

/// Settings row: label on the left, toggle on the right.
class LanguageSettingTile extends StatelessWidget {
  const LanguageSettingTile({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(Icons.translate, color: scheme.primary),
      title: const Text('Language'),
      subtitle: const Text('Choose app language'),
      trailing: const LanguageToggle(),
    );
  }
}
