class StockCategory {
  final String id;
  final String name;
  final String description;
  final String categoryImg;

  StockCategory({
    required this.id,
    required this.name,
    required this.description,
    required this.categoryImg,
  });

  factory StockCategory.fromJson(Map<String, dynamic> json) => StockCategory(
    id: json['_id'] ?? '',
    name: json['name'] ?? '',
    description: json['description'] ?? '',
    categoryImg: json['CategoryImg'] ?? '',
  );
}
