class GstConfig {
  final bool enabled;
  final double cgstRate;
  final double sgstRate;
  final double igstRate;

  GstConfig({
    required this.enabled,
    required this.cgstRate,
    required this.sgstRate,
    required this.igstRate,
  });

  factory GstConfig.fromJson(Map<String, dynamic>? json) => GstConfig(
    enabled: json?['enabled'] ?? true,
    cgstRate: (json?['cgstRate'] as num?)?.toDouble() ?? 1.5,
    sgstRate: (json?['sgstRate'] as num?)?.toDouble() ?? 1.5,
    igstRate: (json?['igstRate'] as num?)?.toDouble() ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'enabled': enabled,
    'cgstRate': cgstRate,
    'sgstRate': sgstRate,
    'igstRate': igstRate,
  };
}

class Firm {
  final String id;
  final String name;
  final String location;
  final num size;
  final String logo;
  final String gst;
  final String email;
  final String contact;
  final String bankName;
  final String branch;
  final String accountNo;
  final String ifscCode;
  final String proprietorName;
  final String firmStamp;
  final String ownerSignature;
  final String secondLogo;
  final String registrationNo;
  final String shopName;
  final String description;
  final String address;
  final String city;
  final String pincode;
  final String panNo;
  final String invoicePrefix;
  final int lastInvoiceNumber;
  final DateTime? firmStartDate;
  final GstConfig gstConfig;
  final String ownerId;
  final String? ownerName;

  Firm({
    required this.id,
    required this.name,
    required this.location,
    required this.size,
    required this.logo,
    required this.gst,
    required this.email,
    required this.contact,
    required this.bankName,
    required this.branch,
    required this.accountNo,
    required this.ifscCode,
    required this.proprietorName,
    required this.firmStamp,
    required this.ownerSignature,
    required this.secondLogo,
    required this.registrationNo,
    required this.shopName,
    required this.description,
    required this.address,
    required this.city,
    required this.pincode,
    required this.panNo,
    required this.invoicePrefix,
    required this.lastInvoiceNumber,
    required this.firmStartDate,
    required this.gstConfig,
    required this.ownerId,
    this.ownerName,
  });

  factory Firm.fromJson(Map<String, dynamic> json) {
    final owner = json['owner'];
    return Firm(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      location: json['location'] ?? '',
      size: json['size'] ?? 0,
      logo: json['logo'] ?? '',
      gst: json['gst'] ?? '',
      email: json['email'] ?? '',
      contact: json['contact'] ?? '',
      bankName: json['bankName'] ?? '',
      branch: json['branch'] ?? '',
      accountNo: json['accountNo'] ?? '',
      ifscCode: json['ifscCode'] ?? '',
      proprietorName: json['proprietorName'] ?? '',
      firmStamp: json['firmStamp'] ?? '',
      ownerSignature: json['ownerSignature'] ?? '',
      secondLogo: json['secondLogo'] ?? '',
      registrationNo: json['registrationNo'] ?? '',
      shopName: json['shopName'] ?? '',
      description: json['description'] ?? '',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      pincode: json['pincode'] ?? '',
      panNo: json['panNo'] ?? '',
      invoicePrefix: json['invoicePrefix'] ?? '',
      lastInvoiceNumber: (json['lastInvoiceNumber'] as num?)?.toInt() ?? 0,
      firmStartDate: json['firmStartDate'] != null
          ? DateTime.tryParse(json['firmStartDate'])
          : null,
      gstConfig: GstConfig.fromJson(json['gstConfig']),
      ownerId: owner is Map ? (owner['_id'] ?? '') : (owner ?? ''),
      ownerName: owner is Map ? owner['name'] : null,
    );
  }
}
