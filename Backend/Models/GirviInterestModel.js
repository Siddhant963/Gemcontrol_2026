const mongoose = require('mongoose');

const girviInterestSchema = mongoose.Schema({
  girvi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Girvi',
    required: true
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
  interestAmount: {
    type: Number,
    required: true
  },
  monthsCalculated: {
    type: Number,
    required: true
  },
  calculationDate: {
    type: Date,
    default: Date.now
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'bankTransfer', 'upi'],
    default: 'cash'
  },
  paymentReference: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  remarks: {
    type: String,
    default: null
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

module.exports = mongoose.model('GirviInterest', girviInterestSchema);