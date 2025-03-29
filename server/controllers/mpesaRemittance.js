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

    // Execute the transaction using the Soroban token contract
    try {
      // Get the platform wallet for receiving the crypto
      const platformWalletPublicKey = process.env.PLATFORM_WALLET_PUBLIC_KEY;
      if (!platformWalletPublicKey) {
        return res.status(500).json({ msg: 'Platform wallet public key not configured' });
      }
      
      // Determine asset details
      let assetCode = sourceCurrency;
      let assetIssuer = null;
      
      // For non-native assets (not XLM), we need the issuer
      if (assetCode !== 'XLM') {
        // Get the issuer from environment variables or config
        if (assetCode === 'USDC') {
          assetIssuer = process.env.USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'; // Default testnet USDC issuer
        } else {
          return res.status(400).json({ msg: 'Unsupported asset type' });
        }
      }
      
      // Import the Soroban utilities
      const sorobanUtils = require('../utils/soroban');
      
      // Get the Remittance contract ID from environment variables
      const remittanceContractId = process.env.REMITTANCE_CONTRACT_ID;
      if (!remittanceContractId) {
        return res.status(500).json({ msg: 'Remittance contract ID not configured' });
      }
      
      console.log(`Using Remittance contract ID: ${remittanceContractId}`);
      
      // Generate a random redemption code for the remittance
      const redemptionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Check token balance before proceeding
      try {
        const balance = await sorobanUtils.getTokenBalance(
          tokenContractId,
          wallet.stellarAddress,
          wallet.stellarSecret
        );
        
        console.log(`Current token balance: ${balance}`);
        
        if (parseFloat(balance) < parseFloat(amount)) {
          return res.status(400).json({ msg: 'Insufficient token balance' });
        }
      } catch (err) {
        console.error('Error checking token balance:', err);
        // Continue anyway as this might fail for various reasons
      }
      
      // Prepare parameters for the token transfer
      const sorobanParams = {
        sender: wallet.stellarAddress,
        recipientPhone: formattedPhone,
        recipientName: recipientName,
        recipientCountry: 'Tanzania',
        amount: amount.toString(),
        sourceCurrency: assetCode,
        targetCurrency: 'TZS',
        includeInsurance: !!includeInsurance,
        redemptionCode: redemptionCode,
        notes: notes || 'EazeFi M-Pesa Remittance'
      };
      
      // Call the Remittance contract to create a new remittance
      const remittanceId = await sorobanUtils.createRemittance(
        remittanceContractId,
        sorobanParams,
        wallet.stellarSecret
      );
      
      // Update transaction with contract details
      transaction.contractTransactionId = remittanceId;
      transaction.status = 'processing';
      await transaction.save();
      
      // Update remittance status
      remittance.status = 'processing';
      remittance.contractRemittanceId = remittanceId;
      remittance.redemptionCode = redemptionCode;
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
          contractRemittanceId: remittance.contractRemittanceId,
          mpesaTransactionId: mpesaResult.transactionId,
          redemptionCode: remittance.redemptionCode
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
