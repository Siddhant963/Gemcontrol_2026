class GirviPayment {
  final DateTime? date;
  final double amount;
  final double interestPortion;
  final double principalPortion;
  final String method;
  final String? reference;

  GirviPayment({
    required this.date,
    required this.amount,
    required this.interestPortion,
    required this.principalPortion,
    required this.method,
    this.reference,
  });

  factory GirviPayment.fromJson(Map<String, dynamic> json) => GirviPayment(
    date: json['date'] != null ? DateTime.tryParse(json['date']) : null,
    amount: (json['amount'] as num?)?.toDouble() ?? 0,
    interestPortion: (json['interestPortion'] as num?)?.toDouble() ?? 0,
    principalPortion: (json['principalPortion'] as num?)?.toDouble() ?? 0,
    method: json['method'] ?? 'cash',
    reference: json['reference'],
  );
}

class Girvi {
  final String id;
  final String itemName;
  final String itemType;
  final String itemDescription;
  final double itemWeight;
  final double itemValue;
  final double principalAmount;
  final double outstandingPrincipal;
  final double accruedInterest;
  final double currentOutstandingAmount;
  final String itemImage;
  final double interestRate;
  final String status; // active, redeemed, defaulted
  final DateTime? lastInterestAccrualDate;
  final double totalInterestPaid;
  final double totalInterestDue;
  final List<GirviPayment> payments;
  final String customerId;
  final String? customerName;
  final String? customerEmail;
  final String firmId;
  final String? firmName;
  final DateTime? lastDateToTake;
  final DateTime? redeemedAt;

  Girvi({
    required this.id,
    required this.itemName,
    required this.itemType,
    required this.itemDescription,
    required this.itemWeight,
    required this.itemValue,
    required this.principalAmount,
    required this.outstandingPrincipal,
    required this.accruedInterest,
    required this.currentOutstandingAmount,
    required this.itemImage,
    required this.interestRate,
    required this.status,
    required this.lastInterestAccrualDate,
    required this.totalInterestPaid,
    required this.totalInterestDue,
    required this.payments,
    required this.customerId,
    this.customerName,
    this.customerEmail,
    required this.firmId,
    this.firmName,
    required this.lastDateToTake,
    this.redeemedAt,
  });

  factory Girvi.fromJson(Map<String, dynamic> json) {
    final customer = json['Customer'] ?? json['customer'];
    final firm = json['firm'];
    return Girvi(
      id: json['_id'] ?? '',
      itemName: json['itemName'] ?? '',
      itemType: json['itemType'] ?? '',
      itemDescription: json['itemDescription'] ?? '',
      itemWeight: (json['itemWeight'] as num?)?.toDouble() ?? 0,
      itemValue: (json['itemValue'] as num?)?.toDouble() ?? 0,
      principalAmount: (json['principalAmount'] as num?)?.toDouble() ?? 0,
      outstandingPrincipal:
          (json['outstandingPrincipal'] as num?)?.toDouble() ?? 0,
      accruedInterest: (json['accruedInterest'] as num?)?.toDouble() ?? 0,
      currentOutstandingAmount:
          (json['currentOutstandingAmount'] as num?)?.toDouble() ?? 0,
      itemImage: json['itemImage'] ?? '',
      interestRate: (json['interestRate'] as num?)?.toDouble() ?? 0,
      status: json['status'] ?? 'active',
      lastInterestAccrualDate: json['lastInterestAccrualDate'] != null
          ? DateTime.tryParse(json['lastInterestAccrualDate'])
          : null,
      totalInterestPaid: (json['totalInterestPaid'] as num?)?.toDouble() ?? 0,
      totalInterestDue: (json['totalInterestDue'] as num?)?.toDouble() ?? 0,
      payments: (json['payments'] as List<dynamic>? ?? [])
          .map((e) => GirviPayment.fromJson(e as Map<String, dynamic>))
          .toList(),
      customerId: customer is Map ? (customer['_id'] ?? '') : (customer ?? ''),
      customerName: customer is Map ? customer['name'] : null,
      customerEmail: customer is Map ? customer['email'] : null,
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
      lastDateToTake: json['lastDateToTake'] != null
          ? DateTime.tryParse(json['lastDateToTake'])
          : null,
      redeemedAt: json['redeemedAt'] != null
          ? DateTime.tryParse(json['redeemedAt'])
          : null,
    );
  }
}

class GirviInterestRecord {
  final String id;
  final String girviId;
  final double interestAmount;
  final int monthsCalculated;
  final DateTime? calculationDate;
  final DateTime? paymentDate;
  final String paymentMethod;
  final String? paymentReference;
  final String status; // pending, paid, overdue
  final String? remarks;

  GirviInterestRecord({
    required this.id,
    required this.girviId,
    required this.interestAmount,
    required this.monthsCalculated,
    required this.calculationDate,
    this.paymentDate,
    required this.paymentMethod,
    this.paymentReference,
    required this.status,
    this.remarks,
  });

  factory GirviInterestRecord.fromJson(Map<String, dynamic> json) {
    final girvi = json['girvi'];
    return GirviInterestRecord(
      id: json['_id'] ?? '',
      girviId: girvi is Map ? (girvi['_id'] ?? '') : (girvi ?? ''),
      interestAmount: (json['interestAmount'] as num?)?.toDouble() ?? 0,
      monthsCalculated: (json['monthsCalculated'] as num?)?.toInt() ?? 0,
      calculationDate: json['calculationDate'] != null
          ? DateTime.tryParse(json['calculationDate'])
          : null,
      paymentDate: json['paymentDate'] != null
          ? DateTime.tryParse(json['paymentDate'])
          : null,
      paymentMethod: json['paymentMethod'] ?? 'cash',
      paymentReference: json['paymentReference'],
      status: json['status'] ?? 'pending',
      remarks: json['remarks'],
    );
  }
}

class GirviSummaryRow {
  final String status;
  final int count;
  final double totalPrincipal;
  final double totalOutstandingPrincipal;
  final double totalOutstanding;
  final double totalInterestDue;

  GirviSummaryRow({
    required this.status,
    required this.count,
    required this.totalPrincipal,
    required this.totalOutstandingPrincipal,
    required this.totalOutstanding,
    required this.totalInterestDue,
  });

  factory GirviSummaryRow.fromJson(Map<String, dynamic> json) =>
      GirviSummaryRow(
        status: json['_id'] ?? '',
        count: (json['count'] as num?)?.toInt() ?? 0,
        totalPrincipal: (json['totalPrincipal'] as num?)?.toDouble() ?? 0,
        totalOutstandingPrincipal:
            (json['totalOutstandingPrincipal'] as num?)?.toDouble() ?? 0,
        totalOutstanding: (json['totalOutstanding'] as num?)?.toDouble() ?? 0,
        totalInterestDue: (json['totalInterestDue'] as num?)?.toDouble() ?? 0,
      );
}
