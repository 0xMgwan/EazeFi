const mongoose = require('mongoose');

const FamilyPoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['admin', 'contributor', 'recipient'],
        default: 'contributor'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  recipients: [
    {
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
      },
      relationship: {
        type: String
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  targetCurrency: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  withdrawalLimit: {
    type: Number,
    required: true
  },
  withdrawalPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  stellarAccount: {
    publicKey: {
      type: String
    },
    sorobanContractId: {
      type: String
    }
  },
  contributions: [
    {
      contributor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: {
        type: Number,
        required: true
      },
      sourceCurrency: {
        type: String,
        required: true
      },
      exchangeRate: {
        type: Number,
        required: true
      },
      transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  withdrawals: [
    {
      recipient: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      redeemMethod: {
        type: String,
        required: true
      },
      redeemDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      completedAt: {
        type: Date
      }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active'
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
FamilyPoolSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FamilyPool', FamilyPoolSchema);
