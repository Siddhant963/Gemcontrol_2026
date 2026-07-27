class AppUser {
  final String id;
  final String name;
  final String email;
  final String contact;
  final String role;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.contact,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: json['_id'] ?? '',
    name: json['name'] ?? '',
    email: json['email'] ?? '',
    contact: json['contact'] ?? '',
    role: (json['role'] ?? 'staff').toString(),
  );

  bool get isAdmin => role.toLowerCase() == 'admin';
}
