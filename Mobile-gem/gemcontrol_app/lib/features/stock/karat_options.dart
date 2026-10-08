/// The ONLY purities the backend accepts (Backend/Controllers/adminController.js
/// VALID_GOLD_KARATS / VALID_DIAMOND_CARATS). A free-text box let people type
/// "22", "22k" or "22 kt", which the server rejects with "Invalid karat" -- so
/// it is a fixed list now.
const kGoldKarats = <String>['24K', '23K', '22K', '20K', '18K'];
const kDiamondCarats = <String>['0.5 Carat', '1 Carat', '1.5 Carat', '2 Carat', '2.5 Carat', '3 Carat'];

/// Options for [materialType]; empty means the material has no karat
/// (silver / platinum / other), so no karat is asked for or sent.
List<String> karatOptionsFor(String materialType) {
  switch (materialType) {
    case 'gold':
      return kGoldKarats;
    case 'diamond':
      return kDiamondCarats;
    default:
      return const [];
  }
}

String karatLabelFor(String materialType) => materialType == 'diamond' ? 'Carat' : 'Karat';

/// Maps a value already stored on an item ("22", "22k", "22 K") to the exact
/// option it means, or null when it can't be matched (the user must re-pick).
String? normalizeKarat(String materialType, String? raw) {
  final options = karatOptionsFor(materialType);
  if (raw == null || options.isEmpty) return null;
  final cleaned = raw.trim();
  if (options.contains(cleaned)) return cleaned;
  if (materialType == 'gold') {
    final m = RegExp(r'^(\d{2})\s*(k|kt|karat)?$', caseSensitive: false).firstMatch(cleaned);
    if (m != null) {
      final candidate = '${m.group(1)}K';
      if (options.contains(candidate)) return candidate;
    }
  } else {
    for (final o in options) {
      if (o.toLowerCase() == cleaned.toLowerCase()) return o;
    }
  }
  return null;
}
