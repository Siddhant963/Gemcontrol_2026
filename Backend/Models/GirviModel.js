const mongoose = require("mongoose");

const girviPaymentSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    interestPortion: { type: Number, required: true },
    principalPortion: { type: Number, required: true },
    method: {
      type: String,
      enum: ["cash", "online", "bankTransfer", "upi"],
      default: "cash",
    },
    reference: { type: String, default: null },
  },
  { _id: false }
);

const girviSchema = mongoose.Schema({
  itemName: {
    type: String,
    required: true,
  },
  itemType: {
    //like gold sliver diamond etc
    type: String,
    required: true,
  },
  itemWeight: {
    type: Number,
    required: true,
  },
  itemValue: {
    type: Number,
    required: true,
  },
  principalAmount: {
    // Original amount given to customer, fixed at creation, never edited
    type: Number,
    required: true,
  },
  outstandingPrincipal: {
    // Remaining principal still owed; decreases as payments are applied
    type: Number,
    required: true,
  },
  accruedInterest: {
    // Unpaid interest accrued so far
    type: Number,
    default: 0,
  },
  currentOutstandingAmount: {
    // outstandingPrincipal + accruedInterest, kept in sync for display/back-compat
    type: Number,
    required: true,
  },
  itemImage: {
    type: String,
    required: true,
  },
  itemDescription: {
    type: String,
    required: true,
  },
  interestRate: {
    // Monthly interest rate in percentage, fixed at creation, never edited
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'defaulted'],
    default: 'active'
  },
  lastInterestAccrualDate: {
    type: Date,
    default: Date.now,
  },
  totalInterestPaid: {
    type: Number,
    default: 0,
  },
  totalInterestDue: {
    // Mirrors accruedInterest, kept for backward compat with existing summary code
    type: Number,
    default: 0,
  },
  payments: [girviPaymentSchema],
  Customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastDateToTake: {
    type: Date,
    required: true,
  },
  redeemedAt: {
    type: Date,
    default: null,
  },
  removeAt: {
    type: Date,
    default: null,
  },
});

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

// Read-only preview of what accrual would add right now, without mutating anything.
girviSchema.methods.previewInterest = function () {
  const now = new Date();
  const last = this.lastInterestAccrualDate || this.createdAt;
  const monthsElapsed = Math.floor((now - last) / MS_PER_MONTH);
  const interestAmount =
    monthsElapsed > 0
      ? (this.outstandingPrincipal * this.interestRate * monthsElapsed) / 100
      : 0;
  return {
    monthsElapsed,
    interestAmount,
    projectedAccruedInterest: this.accruedInterest + interestAmount,
    projectedOutstandingTotal:
      this.outstandingPrincipal + this.accruedInterest + interestAmount,
  };
};

// Persists accrual of simple interest on the outstanding principal since the last accrual date.
// Advances lastInterestAccrualDate by whole elapsed months only, keeping any partial-month
// remainder so it isn't lost, and is safe to call repeatedly (no-ops when < 1 month elapsed).
girviSchema.methods.accrueInterest = function () {
  const now = new Date();
  const last = this.lastInterestAccrualDate || this.createdAt;
  const monthsElapsed = Math.floor((now - last) / MS_PER_MONTH);
  if (monthsElapsed > 0 && this.outstandingPrincipal > 0) {
    const interestAmount =
      (this.outstandingPrincipal * this.interestRate * monthsElapsed) / 100;
    this.accruedInterest += interestAmount;
    this.lastInterestAccrualDate = new Date(
      last.getTime() + monthsElapsed * MS_PER_MONTH
    );
  }
  this.totalInterestDue = this.accruedInterest;
  this.currentOutstandingAmount = this.outstandingPrincipal + this.accruedInterest;
  return this;
};

// Applies a customer payment: interest-first, remainder against principal.
// Auto-marks the loan redeemed when both principal and interest reach zero.
girviSchema.methods.applyPayment = function ({ amount, method, reference }) {
  amount = Number(amount);
  if (!amount || amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  this.accrueInterest();

  const totalOutstanding = this.outstandingPrincipal + this.accruedInterest;
  if (amount > totalOutstanding + 0.01) {
    throw new Error(
      `Payment exceeds outstanding balance of ₹${totalOutstanding.toFixed(2)}`
    );
  }

  const interestPortion = Math.min(amount, this.accruedInterest);
  this.accruedInterest -= interestPortion;
  this.totalInterestPaid += interestPortion;

  const principalPortion = Math.min(amount - interestPortion, this.outstandingPrincipal);
  this.outstandingPrincipal -= principalPortion;

  this.totalInterestDue = this.accruedInterest;
  this.currentOutstandingAmount = this.outstandingPrincipal + this.accruedInterest;

  const paymentEntry = {
    date: new Date(),
    amount,
    interestPortion,
    principalPortion,
    method,
    reference: reference || null,
  };
  this.payments.push(paymentEntry);

  if (this.outstandingPrincipal <= 0.01 && this.accruedInterest <= 0.01) {
    this.outstandingPrincipal = 0;
    this.accruedInterest = 0;
    this.currentOutstandingAmount = 0;
    this.status = "redeemed";
    this.redeemedAt = new Date();
  }

  return paymentEntry;
};

module.exports = mongoose.model("Girvi", girviSchema);
