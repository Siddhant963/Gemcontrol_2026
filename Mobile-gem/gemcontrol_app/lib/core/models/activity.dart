class ActivityItem {
  final String description;
  final String activityType;
  final DateTime? timestamp;

  ActivityItem({
    required this.description,
    required this.activityType,
    required this.timestamp,
  });

  factory ActivityItem.fromJson(Map<String, dynamic> json) => ActivityItem(
    description: json['description'] ?? '',
    activityType: json['activityType'] ?? '',
    timestamp: json['timestamp'] != null
        ? DateTime.tryParse(json['timestamp'])
        : null,
  );
}
