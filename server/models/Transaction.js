const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'swap', 'remittance', 'insurance'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  sourceCurrency: {
    type: String,
    required: true
  },
  targetCurrency: {
    type: String,
    required: function() {
      return ['swap', 'remittance'].includes(this.type);
    }
  },
  exchangeRate: {
    type: Number,
    required: function() {
      return ['swap', 'remittance'].includes(this.type);
    }
  },
  paymentMethod: {
    type: String,
    required: function() {
      return ['deposit', 'remittance'].includes(this.type);
    }
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  stellarTxHash: {
    type: String
  },
  hasInsurance: {
    type: Boolean,
    default: false
  },
  insuranceClaimed: {
    type: Boolean,
    default: false
  },
  insuranceAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
TransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
