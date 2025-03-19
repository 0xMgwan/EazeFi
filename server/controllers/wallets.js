const { validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const stellarUtils = require('../utils/stellar');

// @desc    Get user's wallet
// @route   GET /api/wallets
// @access  Private
exports.getUserWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Get real-time balances from Stellar network
    try {
      const stellarBalances = await stellarUtils.getAccountBalances(wallet.stellarAccount.publicKey);
      
      // Update wallet balances in database
      wallet.balances = stellarBalances.map(balance => {
        return {
          assetCode: balance.asset_code || 'XLM',
          assetIssuer: balance.asset_issuer || null,
          amount: parseFloat(balance.balance),
          lastUpdated: Date.now()
        };
      });
      
      await wallet.save();
    } catch (err) {
      console.error('Error fetching Stellar balances:', err);
      // Continue with existing balances if Stellar API fails
    }

    res.json(wallet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Create a new wallet
// @route   POST /api/wallets
// @access  Private
exports.createWallet = async (req, res) => {
  try {
    // Check if user already has a wallet
    let wallet = await Wallet.findOne({ user: req.user.id });

    if (wallet) {
      return res.status(400).json({ msg: 'User already has a wallet' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create a new Stellar account if user doesn't have one
    let stellarAccount;
    if (!user.stellarAccount || !user.stellarAccount.publicKey) {
      try {
        stellarAccount = await stellarUtils.createStellarAccount();
        
        // Update user with new Stellar account
        user.stellarAccount = {
          publicKey: stellarAccount.publicKey,
          isCustodial: true
        };
        
        await user.save();
      } catch (err) {
        console.error('Error creating Stellar account:', err);
        return res.status(500).json({ msg: 'Error creating Stellar account' });
      }
    } else {
      stellarAccount = {
        publicKey: user.stellarAccount.publicKey,
        isCustodial: user.stellarAccount.isCustodial
      };
    }

    // Create wallet
    wallet = new Wallet({
      user: req.user.id,
      stellarAccount: {
        publicKey: stellarAccount.publicKey,
        isCustodial: stellarAccount.isCustodial
      },
      balances: []
    });

    await wallet.save();

    res.status(201).json(wallet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get wallet balance
// @route   GET /api/wallets/balance
// @access  Private
exports.getWalletBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Get real-time balances from Stellar network
    try {
      const stellarBalances = await stellarUtils.getAccountBalances(wallet.stellarAccount.publicKey);
      
      // Format balances
      const formattedBalances = stellarBalances.map(balance => {
        return {
          assetCode: balance.asset_code || 'XLM',
          assetIssuer: balance.asset_issuer || null,
          amount: parseFloat(balance.balance)
        };
      });
      
      res.json(formattedBalances);
    } catch (err) {
      console.error('Error fetching Stellar balances:', err);
      // Return database balances if Stellar API fails
      res.json(wallet.balances);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Fund wallet
// @route   POST /api/wallets/fund
// @access  Private
exports.fundWallet = async (req, res) => {
  const { amount, currency, paymentMethod } = req.body;

  if (!amount || !currency || !paymentMethod) {
    return res.status(400).json({ msg: 'Please provide amount, currency, and payment method' });
  }

  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Create a transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      sourceCurrency: currency,
      paymentMethod,
      status: 'pending'
    });

    await transaction.save();

    // In a real implementation, we would integrate with payment providers here
    // For the hackathon, we'll simulate a successful payment

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    // Get asset issuer from environment variables
    const assetIssuerEnvVar = `${currency.toUpperCase()}_ASSET_ISSUER`;
    const assetIssuer = process.env[assetIssuerEnvVar];

    if (!assetIssuer) {
      return res.status(400).json({ msg: `Unsupported currency: ${currency}` });
    }

    // For the hackathon, we'll simulate crediting the user's Stellar account
    // In a real implementation, we would use the distribution account to send tokens

    // Update wallet balances
    const existingBalanceIndex = wallet.balances.findIndex(
      b => b.assetCode === currency && b.assetIssuer === assetIssuer
    );

    if (existingBalanceIndex >= 0) {
      wallet.balances[existingBalanceIndex].amount += parseFloat(amount);
      wallet.balances[existingBalanceIndex].lastUpdated = Date.now();
    } else {
      wallet.balances.push({
        assetCode: currency,
        assetIssuer: assetIssuer,
        amount: parseFloat(amount),
        lastUpdated: Date.now()
      });
    }

    await wallet.save();

    res.json({
      success: true,
      transaction,
      wallet
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Withdraw from wallet
// @route   POST /api/wallets/withdraw
// @access  Private
exports.withdrawFromWallet = async (req, res) => {
  const { amount, currency, withdrawalMethod, accountDetails } = req.body;

  if (!amount || !currency || !withdrawalMethod || !accountDetails) {
    return res.status(400).json({ 
      msg: 'Please provide amount, currency, withdrawal method, and account details' 
    });
  }

  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Get asset issuer from environment variables
    const assetIssuerEnvVar = `${currency.toUpperCase()}_ASSET_ISSUER`;
    const assetIssuer = process.env[assetIssuerEnvVar];

    if (!assetIssuer) {
      return res.status(400).json({ msg: `Unsupported currency: ${currency}` });
    }

    // Check if user has sufficient balance
    const balanceIndex = wallet.balances.findIndex(
      b => b.assetCode === currency && b.assetIssuer === assetIssuer
    );

    if (balanceIndex === -1 || wallet.balances[balanceIndex].amount < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Create a transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      sourceCurrency: currency,
      paymentMethod: withdrawalMethod,
      paymentDetails: accountDetails,
      status: 'pending'
    });

    await transaction.save();

    // In a real implementation, we would integrate with payment providers here
    // For the hackathon, we'll simulate a successful withdrawal

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    // Update wallet balance
    wallet.balances[balanceIndex].amount -= parseFloat(amount);
    wallet.balances[balanceIndex].lastUpdated = Date.now();
    await wallet.save();

    res.json({
      success: true,
      transaction,
      wallet
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Swap currencies
// @route   POST /api/wallets/swap
// @access  Private
exports.swapCurrencies = async (req, res) => {
  const { sourceAmount, sourceCurrency, targetCurrency } = req.body;

  if (!sourceAmount || !sourceCurrency || !targetCurrency) {
    return res.status(400).json({ 
      msg: 'Please provide source amount, source currency, and target currency' 
    });
  }

  if (sourceCurrency === targetCurrency) {
    return res.status(400).json({ msg: 'Source and target currencies must be different' });
  }

  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Get asset issuers from environment variables
    const sourceIssuerEnvVar = `${sourceCurrency.toUpperCase()}_ASSET_ISSUER`;
    const targetIssuerEnvVar = `${targetCurrency.toUpperCase()}_ASSET_ISSUER`;
    
    const sourceIssuer = process.env[sourceIssuerEnvVar];
    const targetIssuer = process.env[targetIssuerEnvVar];

    if (!sourceIssuer || !targetIssuer) {
      return res.status(400).json({ msg: 'Unsupported currency pair' });
    }

    // Check if user has sufficient balance
    const sourceBalanceIndex = wallet.balances.findIndex(
      b => b.assetCode === sourceCurrency && b.assetIssuer === sourceIssuer
    );

    if (sourceBalanceIndex === -1 || wallet.balances[sourceBalanceIndex].amount < parseFloat(sourceAmount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Get exchange rate from Stellar DEX
    const sourceAsset = { code: sourceCurrency, issuer: sourceIssuer };
    const targetAsset = { code: targetCurrency, issuer: targetIssuer };
    
    let exchangeInfo;
    try {
      exchangeInfo = await stellarUtils.getExchangeRate(sourceAsset, targetAsset, sourceAmount);
    } catch (err) {
      console.error('Error getting exchange rate:', err);
      return res.status(400).json({ msg: 'Could not determine exchange rate' });
    }

    // Create a transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'swap',
      amount: parseFloat(sourceAmount),
      fee: 0, // Could add a fee here
      sourceCurrency,
      targetCurrency,
      exchangeRate: exchangeInfo.rate,
      status: 'pending'
    });

    await transaction.save();

    // In a real implementation, we would execute the swap on Stellar DEX
    // For the hackathon, we'll simulate a successful swap

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    // Update source currency balance
    wallet.balances[sourceBalanceIndex].amount -= parseFloat(sourceAmount);
    wallet.balances[sourceBalanceIndex].lastUpdated = Date.now();

    // Update target currency balance
    const targetBalanceIndex = wallet.balances.findIndex(
      b => b.assetCode === targetCurrency && b.assetIssuer === targetIssuer
    );

    if (targetBalanceIndex >= 0) {
      wallet.balances[targetBalanceIndex].amount += exchangeInfo.destAmount;
      wallet.balances[targetBalanceIndex].lastUpdated = Date.now();
    } else {
      wallet.balances.push({
        assetCode: targetCurrency,
        assetIssuer: targetIssuer,
        amount: exchangeInfo.destAmount,
        lastUpdated: Date.now()
      });
    }

    await wallet.save();

    res.json({
      success: true,
      transaction,
      exchangeRate: exchangeInfo.rate,
      sourceAmount: parseFloat(sourceAmount),
      targetAmount: exchangeInfo.destAmount,
      wallet
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
