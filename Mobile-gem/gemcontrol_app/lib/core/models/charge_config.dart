/// Shared by Stock.makingChargeConfig and Stock.labourCharge.
enum ChargeUnit { perGram, perKg, perMg, percent, fixed }

ChargeUnit chargeUnitFromString(String? s) {
  switch (s) {
    case 'per_gram':
      return ChargeUnit.perGram;
    case 'per_kg':
      return ChargeUnit.perKg;
    case 'per_mg':
      return ChargeUnit.perMg;
    case 'percent':
      return ChargeUnit.percent;
    case 'fixed':
    default:
      return ChargeUnit.fixed;
  }
}

String chargeUnitToString(ChargeUnit u) {
  switch (u) {
    case ChargeUnit.perGram:
      return 'per_gram';
    case ChargeUnit.perKg:
      return 'per_kg';
    case ChargeUnit.perMg:
      return 'per_mg';
    case ChargeUnit.percent:
      return 'percent';
    case ChargeUnit.fixed:
      return 'fixed';
  }
}

String chargeUnitLabel(ChargeUnit u) {
  switch (u) {
    case ChargeUnit.perGram:
      return '/gram';
    case ChargeUnit.perKg:
      return '/kg';
    case ChargeUnit.perMg:
      return '/mg';
    case ChargeUnit.percent:
      return '%';
    case ChargeUnit.fixed:
      return 'fixed';
  }
}

class ChargeConfig {
  final double value;
  final ChargeUnit unit;

  ChargeConfig({required this.value, required this.unit});

  factory ChargeConfig.fromJson(Map<String, dynamic>? json) => ChargeConfig(
    value: (json?['value'] as num?)?.toDouble() ?? 0,
    unit: chargeUnitFromString(json?['unit']),
  );

  Map<String, dynamic> toJson() => {
    'value': value,
    'unit': chargeUnitToString(unit),
  };
}

class Wastage {
  final double supplier;
  final double customer;

  Wastage({required this.supplier, required this.customer});

  factory Wastage.fromJson(Map<String, dynamic>? json) => Wastage(
    supplier: (json?['supplier'] as num?)?.toDouble() ?? 0,
    customer: (json?['customer'] as num?)?.toDouble() ?? 0,
  );

  Map<String, dynamic> toJson() => {'supplier': supplier, 'customer': customer};
}
