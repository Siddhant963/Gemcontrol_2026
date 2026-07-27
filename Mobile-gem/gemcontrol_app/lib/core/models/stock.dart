import 'charge_config.dart';

enum StockType { wholesale, retail }

StockType stockTypeFromString(String? s) =>
    s == 'wholesale' ? StockType.wholesale : StockType.retail;

class Stock {
  final String id;
  final String name;
  final String materialType; // gold, silver, platinum, diamond, other
  final String stockImg;
  final String stockCode;
  final StockType stockType;
  final double waight; // legacy total weight, kept for back-compat
  final double grossWeight;
  final double lessWeight;
  final double netWeight;
  final String karat;
  final String categoryId;
  final String? categoryName;
  final String firmId;
  final String? firmName;
  final double quantity;
  final double price;
  final Wastage wastage;
  final double makingCharge;
  final ChargeConfig makingChargeConfig;
  final ChargeConfig labourCharge;
  final double stoneCharge;
  final String hsnCode;
  final double totalValue;

  Stock({
    required this.id,
    required this.name,
    required this.materialType,
    required this.stockImg,
    required this.stockCode,
    required this.stockType,
    required this.waight,
    required this.grossWeight,
    required this.lessWeight,
    required this.netWeight,
    required this.karat,
    required this.categoryId,
    this.categoryName,
    required this.firmId,
    this.firmName,
    required this.quantity,
    required this.price,
    required this.wastage,
    required this.makingCharge,
    required this.makingChargeConfig,
    required this.labourCharge,
    required this.stoneCharge,
    required this.hsnCode,
    required this.totalValue,
  });

  factory Stock.fromJson(Map<String, dynamic> json) {
    final category = json['category'];
    final firm = json['firm'];
    return Stock(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      materialType: json['materialgitType'] ?? 'other',
      stockImg: json['stockImg'] ?? '',
      stockCode: json['stockcode'] ?? '',
      stockType: stockTypeFromString(json['stockType']),
      waight: (json['waight'] as num?)?.toDouble() ?? 0,
      grossWeight: (json['grossWeight'] as num?)?.toDouble() ?? 0,
      lessWeight: (json['lessWeight'] as num?)?.toDouble() ?? 0,
      netWeight: (json['netWeight'] as num?)?.toDouble() ?? 0,
      karat: json['karat'] ?? '',
      categoryId: category is Map ? (category['_id'] ?? '') : (category ?? ''),
      categoryName: category is Map ? category['name'] : null,
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      wastage: Wastage.fromJson(json['wastage']),
      makingCharge: (json['makingCharge'] as num?)?.toDouble() ?? 0,
      makingChargeConfig: ChargeConfig.fromJson(json['makingChargeConfig']),
      labourCharge: ChargeConfig.fromJson(json['labourCharge']),
      stoneCharge: (json['stoneCharge'] as num?)?.toDouble() ?? 0,
      hsnCode: json['hsnCode'] ?? '',
      totalValue: (json['totalValue'] as num?)?.toDouble() ?? 0,
    );
  }
}
