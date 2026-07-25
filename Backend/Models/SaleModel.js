const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  saleType: {
    type: String,
    required: true,
    enum: ['stock', 'rawMaterial']
  },
  salematerialId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'items.saleType' // Dynamic reference
  },
  quantity: {
    type: Number,
    required: true
  },
  // Final line amount actually charged (kept as the source of truth for
  // totals — everything below is a display/reprint snapshot only).
  amount: {
    type: Number,
    required: true
  },
  // ---- Snapshot fields, all optional so older sales (and any caller that
  // doesn't send them) keep working unchanged. Captured at sale time so a
  // reprinted invoice shows what was actually sold, not today's stock data. ----
  name: { type: String, default: "" },
  hsnCode: { type: String, default: "" },
  karat: { type: String, default: "" },
  grossWeight: { type: Number, default: 0 },
  lessWeight: { type: Number, default: 0 },
  netWeight: { type: Number, default: 0 },
  rate: { type: Number, default: 0 }, // per-gram metal rate used, if applicable
  makingCharge: { type: Number, default: 0 },
  wastageAmount: { type: Number, default: 0 },
}, { _id: false }); // Disable _id for subdocs if not needed

// One row per payment mode actually used on the bill — lets a single sale be
// settled across cash + card + UPI + bank transfer simultaneously.
const SalePaymentSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'credit', 'online', 'bankTransfer', 'Upi', 'cheque', 'other'],
  },
  amount: { type: Number, required: true },
  reference: { type: String, default: "" },
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
  },
  items: {
    type: [SaleItemSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true
  },
  // Items subtotal before discount/GST.
  subtotal: {
    type: Number,
    default: 0,
  },
  // Discount applied to the subtotal.
  discount: {
    type: { type: String, enum: ['percent', 'fixed'], default: 'fixed' },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  // subtotal - discount.amount
  taxableAmount: {
    type: Number,
    default: 0,
  },
  // GST snapshot — rates come from the firm's gstConfig at sale time so a
  // reprinted invoice stays correct even if the firm's rates change later.
  gst: {
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
  },
  // Final amount actually charged: taxableAmount + all GST components.
  totalAmount: {
    type: Number,
    required: true
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  // Primary/legacy payment mode — for a split payment this is set to
  // "split" and the real breakdown lives in `payments` below.
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'credit', 'online', 'bankTransfer', 'Upi', 'split']
  },
  // Per-mode payment breakdown. Always populated (single entry for the
  // legacy non-split case) so invoices can render "Cash Received / Card
  // Received / ..." rows directly from the sale document.
  payments: {
    type: [SalePaymentSchema],
    default: [],
  },
  udharAmount: {   //it was missing
    type: Number,
    required: true
  },
  paymentRefrence: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  removeAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
