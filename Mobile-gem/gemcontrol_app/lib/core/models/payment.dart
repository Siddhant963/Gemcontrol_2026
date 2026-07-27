class Payment {
  final String id;
  final String paymentType;
  final String paymentReference;
  final double amount;
  final DateTime? paymentDate;
  final String saleId;
  final String customerId;
  final String? customerName;
  final String firmId;
  final String? firmName;

  Payment({
    required this.id,
    required this.paymentType,
    required this.paymentReference,
    required this.amount,
    required this.paymentDate,
    required this.saleId,
    required this.customerId,
    this.customerName,
    required this.firmId,
    this.firmName,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'];
    final firm = json['firm'];
    final sale = json['sale'];
    return Payment(
      id: json['_id'] ?? '',
      paymentType: json['paymentType'] ?? '',
      paymentReference: json['paymentRefrence'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      paymentDate: json['paymentDate'] != null
          ? DateTime.tryParse(json['paymentDate'])
          : null,
      saleId: sale is Map ? (sale['_id'] ?? '') : (sale ?? ''),
      customerId: customer is Map ? (customer['_id'] ?? '') : (customer ?? ''),
      customerName: customer is Map ? customer['name'] : null,
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
    );
  }
}
