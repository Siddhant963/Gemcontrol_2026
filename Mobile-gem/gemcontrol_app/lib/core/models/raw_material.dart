class RawMaterial {
  final String id;
  final String name;
  final String materialType;
  final String rawMaterialCode;
  final double weight;
  final double quantity;
  final double price;
  final String rawMaterialImg;
  final String firmId;
  final String? firmName;

  RawMaterial({
    required this.id,
    required this.name,
    required this.materialType,
    required this.rawMaterialCode,
    required this.weight,
    required this.quantity,
    required this.price,
    required this.rawMaterialImg,
    required this.firmId,
    this.firmName,
  });

  factory RawMaterial.fromJson(Map<String, dynamic> json) {
    final firm = json['firm'];
    return RawMaterial(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      materialType: json['materialType'] ?? 'other',
      rawMaterialCode: json['RawMaterialcode'] ?? '',
      weight: (json['weight'] as num?)?.toDouble() ?? 0,
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      rawMaterialImg: json['rawmaterialImg'] ?? '',
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
    );
  }
}
