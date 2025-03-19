const mongoose = require('mongoose');

const RemittanceSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    name: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    email: {
      type: String
    }
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  sourceCurrency: {
    type: String,
    required: true
  },
  targetCurrency: {
    type: String,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  redeemMethod: {
    type: String
  },
  redeemDetails: {
    type: mongoose.Schema.Types.Mixed
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
  redemptionCode: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Update the updatedAt timestamp before saving
RemittanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Remittance', RemittanceSchema);
