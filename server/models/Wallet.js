const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stellarAccount: {
    publicKey: {
      type: String,
      required: true
    },
    isCustodial: {
      type: Boolean,
      default: true
    }
  },
  balances: [
    {
      assetCode: {
        type: String,
        required: true
      },
      assetIssuer: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  ],
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
WalletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Wallet', WalletSchema);
