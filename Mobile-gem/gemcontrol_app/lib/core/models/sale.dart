class SaleItem {
  final String saleType; // stock | rawMaterial
  final String materialId;
  final double quantity;
  final double amount;
  final String name;
  final String hsnCode;
  final String karat;
  final double grossWeight;
  final double lessWeight;
  final double netWeight;
  final double rate;
  final double makingCharge;
  final double wastageAmount;

  SaleItem({
    required this.saleType,
    required this.materialId,
    required this.quantity,
    required this.amount,
    required this.name,
    required this.hsnCode,
    required this.karat,
    required this.grossWeight,
    required this.lessWeight,
    required this.netWeight,
    required this.rate,
    required this.makingCharge,
    required this.wastageAmount,
  });

  factory SaleItem.fromJson(Map<String, dynamic> json) {
    final material = json['salematerialId'];
    return SaleItem(
      saleType: json['saleType'] ?? 'stock',
      materialId: material is Map ? (material['_id'] ?? '') : (material ?? ''),
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0,
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      name: json['name'] ?? '',
      hsnCode: json['hsnCode'] ?? '',
      karat: json['karat'] ?? '',
      grossWeight: (json['grossWeight'] as num?)?.toDouble() ?? 0,
      lessWeight: (json['lessWeight'] as num?)?.toDouble() ?? 0,
      netWeight: (json['netWeight'] as num?)?.toDouble() ?? 0,
      rate: (json['rate'] as num?)?.toDouble() ?? 0,
      makingCharge: (json['makingCharge'] as num?)?.toDouble() ?? 0,
      wastageAmount: (json['wastageAmount'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toRequestJson() => {
    'saleType': saleType,
    'salematerialId': materialId,
    'quantity': quantity,
    'amount': amount,
  };
}

class SalePayment {
  final String method;
  final double amount;
  final String reference;

  SalePayment({required this.method, required this.amount, this.reference = ''});

  factory SalePayment.fromJson(Map<String, dynamic> json) => SalePayment(
    method: json['method'] ?? '',
    amount: (json['amount'] as num?)?.toDouble() ?? 0,
    reference: json['reference'] ?? '',
  );

  Map<String, dynamic> toJson() => {
    'method': method,
    'amount': amount,
    'reference': reference,
  };
}

class SaleDiscount {
  final String type; // percent | fixed
  final double value;
  final double amount;

  SaleDiscount({required this.type, required this.value, required this.amount});

  factory SaleDiscount.fromJson(Map<String, dynamic>? json) => SaleDiscount(
    type: json?['type'] ?? 'fixed',
    value: (json?['value'] as num?)?.toDouble() ?? 0,
    amount: (json?['amount'] as num?)?.toDouble() ?? 0,
  );

  Map<String, dynamic> toJson() => {'type': type, 'value': value, 'amount': amount};
}

class SaleGst {
  final double cgstRate, sgstRate, igstRate;
  final double cgstAmount, sgstAmount, igstAmount;

  SaleGst({
    required this.cgstRate,
    required this.sgstRate,
    required this.igstRate,
    required this.cgstAmount,
    required this.sgstAmount,
    required this.igstAmount,
  });

  factory SaleGst.fromJson(Map<String, dynamic>? json) => SaleGst(
    cgstRate: (json?['cgstRate'] as num?)?.toDouble() ?? 0,
    sgstRate: (json?['sgstRate'] as num?)?.toDouble() ?? 0,
    igstRate: (json?['igstRate'] as num?)?.toDouble() ?? 0,
    cgstAmount: (json?['cgstAmount'] as num?)?.toDouble() ?? 0,
    sgstAmount: (json?['sgstAmount'] as num?)?.toDouble() ?? 0,
    igstAmount: (json?['igstAmount'] as num?)?.toDouble() ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'cgstRate': cgstRate,
    'sgstRate': sgstRate,
    'igstRate': igstRate,
    'cgstAmount': cgstAmount,
    'sgstAmount': sgstAmount,
    'igstAmount': igstAmount,
  };
}

class Sale {
  final String id;
  final String invoiceNumber;
  final List<SaleItem> items;
  final String customerId;
  final String? customerName;
  final String? customerAddress;
  final String firmId;
  final String? firmName;
  final double subtotal;
  final SaleDiscount discount;
  final double taxableAmount;
  final SaleGst gst;
  final double totalAmount;
  final DateTime? saleDate;
  final String paymentMethod;
  final List<SalePayment> payments;
  final double udharAmount;

  Sale({
    required this.id,
    required this.invoiceNumber,
    required this.items,
    required this.customerId,
    this.customerName,
    this.customerAddress,
    required this.firmId,
    this.firmName,
    required this.subtotal,
    required this.discount,
    required this.taxableAmount,
    required this.gst,
    required this.totalAmount,
    required this.saleDate,
    required this.paymentMethod,
    required this.payments,
    required this.udharAmount,
  });

  factory Sale.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'];
    final firm = json['firm'];
    return Sale(
      id: json['_id'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? '',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => SaleItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      customerId: customer is Map ? (customer['_id'] ?? '') : (customer ?? ''),
      customerName: customer is Map ? customer['name'] : null,
      customerAddress: customer is Map ? customer['address'] : null,
      firmId: firm is Map ? (firm['_id'] ?? '') : (firm ?? ''),
      firmName: firm is Map ? firm['name'] : null,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      discount: SaleDiscount.fromJson(json['discount']),
      taxableAmount: (json['taxableAmount'] as num?)?.toDouble() ?? 0,
      gst: SaleGst.fromJson(json['gst']),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0,
      saleDate: json['saleDate'] != null
          ? DateTime.tryParse(json['saleDate'])
          : null,
      paymentMethod: json['paymentMethod'] ?? '',
      payments: (json['payments'] as List<dynamic>? ?? [])
          .map((e) => SalePayment.fromJson(e as Map<String, dynamic>))
          .toList(),
      udharAmount: (json['udharAmount'] as num?)?.toDouble() ?? 0,
    );
  }
}
