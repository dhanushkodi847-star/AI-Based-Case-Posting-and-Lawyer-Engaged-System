const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
