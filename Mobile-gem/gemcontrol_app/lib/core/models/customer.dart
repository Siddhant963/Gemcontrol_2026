class Customer {
  final String id;
  final String name;
  final String email;
  final String contact;
  final String address;
  final String firmId;
  final String? firmName;

  Customer({
    required this.id,
    required this.name,
    required this.email,
    required this.contact,
    required this.address,
    required this.firmId,
    this.firmName,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    final firm = json['firm'];
    return Customer(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      contact: json['contact'] ?? '',
      address: json['address'] ?? '',
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
    );
  }
}
