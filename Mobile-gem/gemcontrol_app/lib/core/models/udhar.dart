class Udhar {
  final String id;
  final String customerId;
  final String? customerName;
  final String? customerEmail;
  final String firmId;
  final String? firmName;
  final double amount;
  final DateTime? udharDate;
  final String saleId;

  Udhar({
    required this.id,
    required this.customerId,
    this.customerName,
    this.customerEmail,
    required this.firmId,
    this.firmName,
    required this.amount,
    required this.udharDate,
    required this.saleId,
  });

  factory Udhar.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'];
    final firm = json['firm'];
    final sale = json['sale'];
    return Udhar(
      id: json['_id'] ?? '',
      customerId: customer is Map ? (customer['_id'] ?? '') : (customer ?? ''),
      customerName: customer is Map ? customer['name'] : null,
      customerEmail: customer is Map ? customer['email'] : null,
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      udharDate: json['udharDate'] != null
          ? DateTime.tryParse(json['udharDate'])
          : null,
      saleId: sale is Map ? (sale['_id'] ?? '') : (sale ?? ''),
    );
  }
}

class UdharSettlement {
  final String id;
  final String udharId;
  final double? udharAmount;
  final String customerId;
  final String? customerName;
  final String firmId;
  final String? firmName;
  final double amount;
  final DateTime? paymentDate;

  UdharSettlement({
    required this.id,
    required this.udharId,
    this.udharAmount,
    required this.customerId,
    this.customerName,
    required this.firmId,
    this.firmName,
    required this.amount,
    required this.paymentDate,
  });

  factory UdharSettlement.fromJson(Map<String, dynamic> json) {
    final udhar = json['udhar'];
    final customer = json['customer'];
    final firm = json['firm'];
    return UdharSettlement(
      id: json['_id'] ?? '',
      udharId: udhar is Map ? (udhar['_id'] ?? '') : (udhar ?? ''),
      udharAmount: udhar is Map
          ? (udhar['amount'] as num?)?.toDouble()
          : null,
      customerId: customer is Map ? (customer['_id'] ?? '') : (customer ?? ''),
      customerName: customer is Map ? customer['name'] : null,
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      paymentDate: json['paymentDate'] != null
          ? DateTime.tryParse(json['paymentDate'])
          : null,
    );
  }
}
