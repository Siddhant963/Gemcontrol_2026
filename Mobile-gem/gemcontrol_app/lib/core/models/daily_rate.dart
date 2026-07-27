class GoldRate {
  final double k24, k23, k22, k20, k18;
  GoldRate({
    required this.k24,
    required this.k23,
    required this.k22,
    required this.k20,
    required this.k18,
  });

  factory GoldRate.fromJson(Map<String, dynamic>? json) => GoldRate(
    k24: (json?['24K'] as num?)?.toDouble() ?? 0,
    k23: (json?['23K'] as num?)?.toDouble() ?? 0,
    k22: (json?['22K'] as num?)?.toDouble() ?? 0,
    k20: (json?['20K'] as num?)?.toDouble() ?? 0,
    k18: (json?['18K'] as num?)?.toDouble() ?? 0,
  );
}

class DiamondRate {
  final double c0_5, c1, c1_5, c2, c2_5, c3;
  DiamondRate({
    required this.c0_5,
    required this.c1,
    required this.c1_5,
    required this.c2,
    required this.c2_5,
    required this.c3,
  });

  factory DiamondRate.fromJson(Map<String, dynamic>? json) => DiamondRate(
    c0_5: (json?['0_5 Carat'] as num?)?.toDouble() ?? 0,
    c1: (json?['1 Carat'] as num?)?.toDouble() ?? 0,
    c1_5: (json?['1_5 Carat'] as num?)?.toDouble() ?? 0,
    c2: (json?['2 Carat'] as num?)?.toDouble() ?? 0,
    c2_5: (json?['2_5 Carat'] as num?)?.toDouble() ?? 0,
    c3: (json?['3 Carat'] as num?)?.toDouble() ?? 0,
  );
}

class DailyRate {
  final String id;
  final DateTime date;
  final GoldRate gold;
  final double silver;
  final DiamondRate diamond;

  DailyRate({
    required this.id,
    required this.date,
    required this.gold,
    required this.silver,
    required this.diamond,
  });

  factory DailyRate.fromJson(Map<String, dynamic> json) {
    final rate = json['rate'] ?? {};
    return DailyRate(
      id: json['_id'] ?? '',
      date: json['date'] != null
          ? (DateTime.tryParse(json['date']) ?? DateTime.now())
          : DateTime.now(),
      gold: GoldRate.fromJson(rate['gold']),
      silver: (rate['silver'] as num?)?.toDouble() ?? 0,
      diamond: DiamondRate.fromJson(rate['daimond']),
    );
  }
}
