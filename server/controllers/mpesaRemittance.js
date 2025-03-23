/**
 * M-Pesa Remittance Controller
 * Handles crypto to M-Pesa transfers for Tanzania
 */
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Remittance = require('../models/Remittance');
const stellarUtils = require('../utils/stellar');
const mpesaUtils = require('../utils/mpesa');

/**
 * @desc    Send crypto to M-Pesa in Tanzania
 * @route   POST /api/remittances/mpesa/send
 * @access  Private
 */
exports.sendCryptoToMpesa = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    amount, 
    recipientPhone, 
    recipientName,
    sourceCurrency, // XLM or USDC
    includeInsurance,
    notes
  } = req.body;

  try {
    // Check if sender exists
    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json({ msg: 'Sender not found' });
    }

    // Get sender's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Check if sender has sufficient balance
    const sourceBalanceIndex = wallet.balances.findIndex(b => b.assetCode === sourceCurrency);
    if (sourceBalanceIndex === -1 || wallet.balances[sourceBalanceIndex].amount < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Format phone number for Tanzania M-Pesa (ensure it starts with 255)
    let formattedPhone = recipientPhone;
    if (recipientPhone.startsWith('0')) {
      formattedPhone = `255${recipientPhone.substring(1)}`;
    } else if (recipientPhone.startsWith('+255')) {
      formattedPhone = recipientPhone.substring(1);
    }

    // Convert crypto amount to TZS
    let tzsAmount;
    try {
      tzsAmount = await mpesaUtils.convertCryptoToTZS(sourceCurrency, parseFloat(amount));
    } catch (err) {
      console.error('Error converting crypto to TZS:', err);
      return res.status(500).json({ msg: 'Failed to convert crypto to TZS' });
    }

    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'mpesa_remittance',
      amount: parseFloat(amount),
      sourceCurrency,
      targetCurrency: 'TZS',
      exchangeRate: tzsAmount / parseFloat(amount),
      paymentMethod: 'mpesa',
      hasInsurance: includeInsurance,
      status: 'pending'
    });

    await transaction.save();

    // Create remittance record
    const remittance = new Remittance({
      sender: req.user.id,
      recipient: {
        name: recipientName,
        phoneNumber: formattedPhone,
        country: 'Tanzania',
        email: null
      },
      transaction: transaction._id,
      amount: parseFloat(amount),
      sourceCurrency,
      targetCurrency: 'TZS',
      targetAmount: tzsAmount,
      exchangeRate: tzsAmount / parseFloat(amount),
      status: 'pending',
      paymentMethod: 'mpesa',
      hasInsurance: includeInsurance,
      notes
    });

    await remittance.save();

    // Execute the Stellar transaction to move funds from user's wallet to platform wallet
    try {
      // Get the platform wallet for receiving the crypto
      const platformWalletPublicKey = process.env.PLATFORM_WALLET_PUBLIC_KEY;
      
      // Determine asset details
      let assetCode = sourceCurrency;
      let assetIssuer = null;
      
      // For non-native assets (not XLM), we need the issuer
      if (assetCode !== 'XLM') {
        // Get the issuer from environment variables or config
        if (assetCode === 'USDC') {
          assetIssuer = process.env.USDC_ISSUER;
        } else {
          return res.status(400).json({ msg: 'Unsupported asset type' });
        }
      }
      
      // Send payment on Stellar network
      const stellarResult = await stellarUtils.sendPayment(
        wallet.stellarSecret,
        platformWalletPublicKey,
        amount,
        assetCode,
        assetIssuer
      );
      
      // Update transaction with Stellar transaction details
      transaction.contractTransactionId = stellarResult.hash;
      transaction.status = 'processing';
      await transaction.save();
      
      // Update remittance status
      remittance.status = 'processing';
      remittance.stellarTransactionId = stellarResult.hash;
      await remittance.save();
      
      // Initiate M-Pesa payment
      const mpesaResult = await mpesaUtils.initiateC2B(
        formattedPhone,
        tzsAmount,
        `EAZEFI-${remittance._id.toString().substring(0, 8)}`,
        notes || 'EazeFi Remittance'
      );
      
      if (mpesaResult.success) {
        // Update remittance with M-Pesa transaction details
        remittance.mpesaTransactionId = mpesaResult.transactionId;
        remittance.status = 'completed';
        await remittance.save();
        
        // Update transaction status
        transaction.status = 'completed';
        await transaction.save();
        
        // Update wallet balance
        wallet.balances[sourceBalanceIndex].amount -= parseFloat(amount);
        wallet.balances[sourceBalanceIndex].lastUpdated = Date.now();
        await wallet.save();
        
        return res.json({
          success: true,
          remittance,
          transaction,
          stellarTransactionId: stellarResult.hash,
          mpesaTransactionId: mpesaResult.transactionId
        });
      } else {
        // M-Pesa transaction failed
        remittance.status = 'failed';
        remittance.failureReason = mpesaResult.error;
        await remittance.save();
        
        transaction.status = 'failed';
        transaction.failureReason = mpesaResult.error;
        await transaction.save();
        
        return res.status(500).json({ 
          msg: 'Failed to process M-Pesa payment', 
          error: mpesaResult.error,
          details: mpesaResult.details
        });
      }
    } catch (err) {
      console.error('Error processing Stellar transaction:', err);
      
      // Update status to failed
      remittance.status = 'failed';
      remittance.failureReason = err.message;
      await remittance.save();
      
      transaction.status = 'failed';
      transaction.failureReason = err.message;
      await transaction.save();
      
      return res.status(500).json({ 
        msg: 'Failed to process Stellar transaction', 
        error: err.message 
      });
    }
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Check M-Pesa remittance status
 * @route   GET /api/remittances/mpesa/status/:id
 * @access  Private
 */
exports.checkMpesaRemittanceStatus = async (req, res) => {
  try {
    const remittance = await Remittance.findById(req.params.id);
    
    if (!remittance) {
      return res.status(404).json({ msg: 'Remittance not found' });
    }
    
    // Check if this remittance belongs to the user
    if (remittance.sender.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Check if this is an M-Pesa remittance
    if (remittance.paymentMethod !== 'mpesa') {
      return res.status(400).json({ msg: 'Not an M-Pesa remittance' });
    }
    
    // If the remittance is already completed or failed, return its status
    if (remittance.status === 'completed' || remittance.status === 'failed') {
      return res.json({
        success: true,
        status: remittance.status,
        remittance
      });
    }
    
    // If the remittance is still processing, check its status with M-Pesa
    if (remittance.mpesaTransactionId) {
      const statusResult = await mpesaUtils.checkTransactionStatus(remittance.mpesaTransactionId);
      
      if (statusResult.success) {
        // Update remittance status based on M-Pesa response
        const mpesaStatus = statusResult.status.output_ResponseCode;
        
        if (mpesaStatus === '0') {
          // Transaction successful
          remittance.status = 'completed';
          await remittance.save();
          
          // Update transaction status
          const transaction = await Transaction.findById(remittance.transaction);
          if (transaction) {
            transaction.status = 'completed';
            await transaction.save();
          }
        } else if (['1', '2', '3'].includes(mpesaStatus)) {
          // Transaction still processing
          remittance.status = 'processing';
          await remittance.save();
        } else {
          // Transaction failed
          remittance.status = 'failed';
          remittance.failureReason = statusResult.status.output_ResponseDesc;
          await remittance.save();
          
          // Update transaction status
          const transaction = await Transaction.findById(remittance.transaction);
          if (transaction) {
            transaction.status = 'failed';
            transaction.failureReason = statusResult.status.output_ResponseDesc;
            await transaction.save();
          }
        }
        
        return res.json({
          success: true,
          status: remittance.status,
          mpesaStatus: statusResult.status,
          remittance
        });
      } else {
        return res.status(500).json({
          success: false,
          error: statusResult.error,
          details: statusResult.details
        });
      }
    } else {
      return res.status(400).json({ msg: 'No M-Pesa transaction ID found for this remittance' });
    }
  } catch (err) {
    console.error('Error checking M-Pesa remittance status:', err);
    res.status(500).send('Server error');
  }
};
