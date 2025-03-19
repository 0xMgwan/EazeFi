const { validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Remittance = require('../models/Remittance');
const FamilyPool = require('../models/FamilyPool');
const stellarUtils = require('../utils/stellar');

// @desc    Send remittance using Soroban smart contract
// @route   POST /api/remittances/send
// @access  Private
exports.sendRemittance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    amount, 
    recipientPhone, 
    recipientName,
    recipientCountry,
    recipientEmail,
    sourceCurrency, 
    targetCurrency, 
    paymentMethod,
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

    // Get token addresses from environment variables or token wrapper contract
    const remittanceContractId = process.env.REMITTANCE_CONTRACT_ID;
    const tokenWrapperContractId = process.env.TOKEN_WRAPPER_CONTRACT_ID;
    
    if (!remittanceContractId || !tokenWrapperContractId) {
      return res.status(400).json({ msg: 'Contract configuration missing' });
    }

    // Get token information from the token wrapper contract
    let sourceTokenInfo, targetTokenInfo;
    try {
      sourceTokenInfo = await stellarUtils.getTokenInfo(tokenWrapperContractId, sourceCurrency);
      targetTokenInfo = await stellarUtils.getTokenInfo(tokenWrapperContractId, targetCurrency);
    } catch (err) {
      console.error('Error getting token info:', err);
      return res.status(400).json({ msg: 'Could not retrieve token information' });
    }

    // Check if sender has sufficient balance
    const sourceBalanceIndex = wallet.balances.findIndex(
      b => b.assetCode === sourceCurrency && b.assetIssuer === sourceTokenInfo.issuer
    );

    if (sourceBalanceIndex === -1 || wallet.balances[sourceBalanceIndex].amount < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Calculate exchange rate using the token wrapper contract
    let exchangeRate;
    try {
      const exchangeRateResult = await stellarUtils.calculateTokenExchangeRate(
        tokenWrapperContractId,
        sourceCurrency,
        targetCurrency,
        parseFloat(amount) * 10000 // Convert to basis points for contract
      );
      exchangeRate = exchangeRateResult / 10000; // Convert from basis points
    } catch (err) {
      console.error('Error calculating exchange rate:', err);
      return res.status(400).json({ msg: 'Could not determine exchange rate' });
    }

    // Generate a unique redemption code
    const redemptionCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'remittance',
      amount: parseFloat(amount),
      sourceCurrency,
      targetCurrency,
      exchangeRate,
      paymentMethod,
      hasInsurance: includeInsurance,
      status: 'pending'
    });

    await transaction.save();

    // Create remittance record in the database
    const remittance = new Remittance({
      sender: req.user.id,
      recipient: {
        name: recipientName,
        phoneNumber: recipientPhone,
        country: recipientCountry,
        email: recipientEmail || null
      },
      transaction: transaction._id,
      amount: parseFloat(amount),
      sourceCurrency,
      targetCurrency,
      exchangeRate,
      status: 'pending',
      paymentMethod,
      hasInsurance: includeInsurance,
      redemptionCode,
      notes,
      contractId: remittanceContractId
    });

    await remittance.save();

    // Create the remittance on the Soroban contract
    try {
      const contractResult = await stellarUtils.createRemittance(
        wallet.stellarSecret, // User's Stellar secret key
        remittanceContractId,
        recipientPhone,
        recipientName,
        recipientCountry,
        parseFloat(amount) * 10000, // Convert to basis points for contract
        sourceTokenInfo.token_address, // Source token address
        targetTokenInfo.token_address, // Target token address
        Math.floor(exchangeRate * 10000), // Exchange rate in basis points
        includeInsurance,
        redemptionCode,
        notes || ''
      );

      // Store the contract transaction ID in our database
      remittance.contractTransactionId = contractResult.hash;
      remittance.status = 'completed';
      await remittance.save();

      // Update transaction status
      transaction.status = 'completed';
      transaction.contractTransactionId = contractResult.hash;
      await transaction.save();

      // Update wallet balance (the actual balance will be updated by the contract)
      // We're just updating our local record
      wallet.balances[sourceBalanceIndex].amount -= parseFloat(amount);
      wallet.balances[sourceBalanceIndex].lastUpdated = Date.now();
      await wallet.save();

      // Send notification to recipient (would be implemented with SMS or email service)
      // For hackathon, we'll just log it
      console.log(`Notification sent to ${recipientPhone}: You have received a remittance of ${parseFloat(amount) * exchangeRate} ${targetCurrency}. Use code ${redemptionCode} to redeem.`);

      res.json({
        success: true,
        remittance,
        transaction,
        redemptionCode,
        contractTransactionId: contractResult.hash
      });
    } catch (err) {
      console.error('Error creating remittance on contract:', err);
      
      // Update status to failed
      remittance.status = 'failed';
      remittance.failureReason = err.message;
      await remittance.save();
      
      transaction.status = 'failed';
      transaction.failureReason = err.message;
      await transaction.save();
      
      return res.status(500).json({ 
        msg: 'Failed to create remittance on blockchain', 
        error: err.message 
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get user's remittances
// @route   GET /api/remittances
// @access  Private
exports.getUserRemittances = async (req, res) => {
  try {
    const remittances = await Remittance.find({ sender: req.user.id })
      .sort({ createdAt: -1 })
      .populate('transaction');

    res.json(remittances);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get remittance by ID
// @route   GET /api/remittances/:id
// @access  Private
exports.getRemittanceById = async (req, res) => {
  try {
    const remittance = await Remittance.findById(req.params.id)
      .populate('transaction')
      .populate('sender', 'name email phoneNumber');

    if (!remittance) {
      return res.status(404).json({ msg: 'Remittance not found' });
    }

    // Check if user is authorized to view this remittance
    if (remittance.sender.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(remittance);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Remittance not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Redeem remittance
// @route   POST /api/remittances/redeem
// @access  Private
exports.redeemRemittance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { remittanceId, redeemMethod, accountNumber } = req.body;

  try {
    const remittance = await Remittance.findById(remittanceId);

    if (!remittance) {
      return res.status(404).json({ msg: 'Remittance not found' });
    }

    if (remittance.status !== 'completed') {
      return res.status(400).json({ msg: 'Remittance is not ready for redemption' });
    }

    // In a real implementation, we would verify the recipient's identity
    // and process the payout via the selected method (e.g., M-Pesa)
    // For the hackathon, we'll simulate a successful redemption

    remittance.redeemMethod = redeemMethod;
    remittance.redeemDetails = { accountNumber };
    remittance.status = 'completed';
    remittance.completedAt = Date.now();

    await remittance.save();

    res.json({
      success: true,
      remittance
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Remittance not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Create a family pool
// @route   POST /api/remittances/family-pool/create
// @access  Private
exports.createFamilyPool = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, members, withdrawalLimit, targetCurrency, withdrawalPeriod, recipients } = req.body;

  try {
    // Create a new Stellar account for the pool
    let stellarAccount;
    try {
      stellarAccount = await stellarUtils.createStellarAccount();
    } catch (err) {
      console.error('Error creating Stellar account for family pool:', err);
      return res.status(500).json({ msg: 'Error creating Stellar account for family pool' });
    }

    // Create the family pool
    const familyPool = new FamilyPool({
      name,
      creator: req.user.id,
      members: [
        {
          user: req.user.id,
          role: 'admin',
          addedAt: Date.now()
        }
      ],
      recipients: recipients || [],
      targetCurrency,
      withdrawalLimit,
      withdrawalPeriod: withdrawalPeriod || 'weekly',
      stellarAccount: {
        publicKey: stellarAccount.publicKey
      }
    });

    // Add members if provided
    if (members && members.length > 0) {
      for (const member of members) {
        // Check if member exists
        const user = await User.findOne({ email: member.email });
        
        if (user) {
          familyPool.members.push({
            user: user._id,
            role: member.role || 'contributor',
            addedAt: Date.now()
          });
        } else {
          // For non-existing members, we could send an invitation
          // For the hackathon, we'll just skip them
          console.log(`Member with email ${member.email} not found`);
        }
      }
    }

    await familyPool.save();

    res.status(201).json(familyPool);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Contribute to a family pool
// @route   POST /api/remittances/family-pool/contribute
// @access  Private
exports.contributeToFamilyPool = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { poolId, amount, sourceCurrency, paymentMethod } = req.body;

  try {
    // Check if pool exists
    const familyPool = await FamilyPool.findById(poolId);
    
    if (!familyPool) {
      return res.status(404).json({ msg: 'Family pool not found' });
    }

    // Check if user is a member of the pool
    const isMember = familyPool.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'User is not a member of this pool' });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Get asset issuers from environment variables
    const sourceIssuerEnvVar = `${sourceCurrency.toUpperCase()}_ASSET_ISSUER`;
    const targetIssuerEnvVar = `${familyPool.targetCurrency.toUpperCase()}_ASSET_ISSUER`;
    
    const sourceIssuer = process.env[sourceIssuerEnvVar];
    const targetIssuer = process.env[targetIssuerEnvVar];

    if (!sourceIssuer || !targetIssuer) {
      return res.status(400).json({ msg: 'Unsupported currency pair' });
    }

    // Check if user has sufficient balance
    const sourceBalanceIndex = wallet.balances.findIndex(
      b => b.assetCode === sourceCurrency && b.assetIssuer === sourceIssuer
    );

    if (sourceBalanceIndex === -1 || wallet.balances[sourceBalanceIndex].amount < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Calculate exchange rate if source and target currencies are different
    let exchangeRate = 1;
    let targetAmount = parseFloat(amount);

    if (sourceCurrency !== familyPool.targetCurrency) {
      const sourceAsset = { code: sourceCurrency, issuer: sourceIssuer };
      const targetAsset = { code: familyPool.targetCurrency, issuer: targetIssuer };
      
      try {
        const exchangeInfo = await stellarUtils.getExchangeRate(sourceAsset, targetAsset, amount);
        exchangeRate = exchangeInfo.rate;
        targetAmount = exchangeInfo.destAmount;
      } catch (err) {
        console.error('Error getting exchange rate:', err);
        return res.status(400).json({ msg: 'Could not determine exchange rate' });
      }
    }

    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'remittance',
      amount: parseFloat(amount),
      fee: 0, // No fee for family pool contributions
      sourceCurrency,
      targetCurrency: familyPool.targetCurrency,
      exchangeRate,
      paymentMethod,
      status: 'pending'
    });

    await transaction.save();

    // In a real implementation, we would process the payment and execute the transfer on Stellar
    // For the hackathon, we'll simulate a successful payment and transfer

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    // Add contribution to family pool
    familyPool.contributions.push({
      contributor: req.user.id,
      amount: targetAmount,
      sourceCurrency,
      exchangeRate,
      transaction: transaction._id,
      createdAt: Date.now()
    });

    // Update pool balance
    familyPool.balance += targetAmount;
    await familyPool.save();

    // Update wallet balance
    wallet.balances[sourceBalanceIndex].amount -= parseFloat(amount);
    wallet.balances[sourceBalanceIndex].lastUpdated = Date.now();
    await wallet.save();

    res.json({
      success: true,
      contribution: familyPool.contributions[familyPool.contributions.length - 1],
      transaction,
      familyPool
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Family pool not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Withdraw from a family pool
// @route   POST /api/remittances/family-pool/withdraw
// @access  Private
exports.withdrawFromFamilyPool = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { poolId, amount, redeemMethod, accountNumber } = req.body;

  try {
    // Check if pool exists
    const familyPool = await FamilyPool.findById(poolId);
    
    if (!familyPool) {
      return res.status(404).json({ msg: 'Family pool not found' });
    }

    // Check if user is a member of the pool or a recipient
    const isMember = familyPool.members.some(member => 
      member.user.toString() === req.user.id
    );

    const isRecipient = familyPool.recipients.some(recipient => 
      recipient.phoneNumber === req.body.phoneNumber
    );

    if (!isMember && !isRecipient) {
      return res.status(401).json({ msg: 'User is not authorized to withdraw from this pool' });
    }

    // Check if pool has sufficient balance
    if (familyPool.balance < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient pool balance' });
    }

    // Check withdrawal limit
    if (parseFloat(amount) > familyPool.withdrawalLimit) {
      return res.status(400).json({ 
        msg: `Withdrawal amount exceeds the limit of ${familyPool.withdrawalLimit} ${familyPool.targetCurrency}`
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      sourceCurrency: familyPool.targetCurrency,
      paymentMethod: redeemMethod,
      paymentDetails: { accountNumber },
      status: 'pending'
    });

    await transaction.save();

    // In a real implementation, we would process the withdrawal via the selected method
    // For the hackathon, we'll simulate a successful withdrawal

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    // Add withdrawal to family pool
    const recipient = isMember 
      ? { user: req.user.id } 
      : familyPool.recipients.find(r => r.phoneNumber === req.body.phoneNumber);

    familyPool.withdrawals.push({
      recipient,
      amount: parseFloat(amount),
      redeemMethod,
      redeemDetails: { accountNumber },
      status: 'completed',
      transaction: transaction._id,
      createdAt: Date.now(),
      completedAt: Date.now()
    });

    // Update pool balance
    familyPool.balance -= parseFloat(amount);
    await familyPool.save();

    res.json({
      success: true,
      withdrawal: familyPool.withdrawals[familyPool.withdrawals.length - 1],
      transaction,
      familyPool
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Family pool not found' });
    }
    res.status(500).send('Server error');
  }
};
