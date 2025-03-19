const { validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const sdexUtils = require('../utils/sdex');
const stellarUtils = require('../utils/stellar');

// @desc    Get exchange rate between two assets
// @route   GET /api/sdex/rate
// @access  Private
exports.getExchangeRate = async (req, res) => {
  const { sourceAsset, destAsset, amount } = req.query;
  
  if (!sourceAsset || !destAsset || !amount) {
    return res.status(400).json({ msg: 'Please provide sourceAsset, destAsset, and amount' });
  }

  try {
    // Parse asset codes and issuers
    const [sourceCode, sourceIssuer] = sourceAsset.split(':');
    const [destCode, destIssuer] = destAsset.split(':');

    // Get the market price
    const marketPrice = await sdexUtils.getMarketPrice(
      sourceCode,
      sourceIssuer,
      destCode,
      destIssuer
    );

    // Find the best path for the specified amount
    const pathInfo = await sdexUtils.findBestPath(
      sourceCode,
      sourceIssuer,
      destCode,
      destIssuer,
      amount
    );

    res.json({
      sourceAsset: `${sourceCode}${sourceIssuer ? `:${sourceIssuer}` : ''}`,
      destAsset: `${destCode}${destIssuer ? `:${destIssuer}` : ''}`,
      amount,
      destAmount: pathInfo.destAmount,
      exchangeRate: parseFloat(pathInfo.destAmount) / parseFloat(amount),
      marketPrice: marketPrice.price,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error getting exchange rate:', err);
    res.status(500).json({ msg: 'Error getting exchange rate', error: err.message });
  }
};

// @desc    Get liquidity information for a trading pair
// @route   GET /api/sdex/liquidity
// @access  Private
exports.getLiquidity = async (req, res) => {
  const { baseAsset, counterAsset } = req.query;
  
  if (!baseAsset || !counterAsset) {
    return res.status(400).json({ msg: 'Please provide baseAsset and counterAsset' });
  }

  try {
    // Parse asset codes and issuers
    const [baseCode, baseIssuer] = baseAsset.split(':');
    const [counterCode, counterIssuer] = counterAsset.split(':');

    // Get liquidity information
    const liquidityInfo = await sdexUtils.getLiquidity(
      baseCode,
      baseIssuer,
      counterCode,
      counterIssuer
    );

    res.json({
      baseAsset: `${baseCode}${baseIssuer ? `:${baseIssuer}` : ''}`,
      counterAsset: `${counterCode}${counterIssuer ? `:${counterIssuer}` : ''}`,
      ...liquidityInfo
    });
  } catch (err) {
    console.error('Error getting liquidity:', err);
    res.status(500).json({ msg: 'Error getting liquidity', error: err.message });
  }
};

// @desc    Execute a swap on SDEX
// @route   POST /api/sdex/swap
// @access  Private
exports.executeSwap = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    sellAsset, 
    buyAsset, 
    amount, 
    slippageTolerance = 1 // Default 1% slippage tolerance
  } = req.body;

  try {
    // Check if user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ msg: 'Wallet not found' });
    }

    // Parse asset codes and issuers
    const [sellCode, sellIssuer] = sellAsset.split(':');
    const [buyCode, buyIssuer] = buyAsset.split(':');

    // Check if user has sufficient balance
    const sellBalanceIndex = wallet.balances.findIndex(
      b => b.assetCode === sellCode && b.assetIssuer === sellIssuer
    );

    if (sellBalanceIndex === -1 || wallet.balances[sellBalanceIndex].amount < parseFloat(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Find the best path for the specified amount
    const pathInfo = await sdexUtils.findBestPath(
      sellCode,
      sellIssuer,
      buyCode,
      buyIssuer,
      amount
    );

    // Calculate minimum destination amount with slippage tolerance
    const minDestAmount = parseFloat(pathInfo.destAmount) * (1 - (slippageTolerance / 100));

    // Create transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'swap',
      amount: parseFloat(amount),
      sourceCurrency: sellCode,
      targetCurrency: buyCode,
      exchangeRate: parseFloat(pathInfo.destAmount) / parseFloat(amount),
      status: 'pending'
    });

    await transaction.save();

    // Execute the swap
    const swapResult = await sdexUtils.executeSwap(
      wallet.stellarSecret,
      sellCode,
      sellIssuer,
      buyCode,
      buyIssuer,
      amount,
      minDestAmount.toString(),
      pathInfo.path
    );

    // Update transaction status
    transaction.status = 'completed';
    transaction.txHash = swapResult.hash;
    await transaction.save();

    // Update wallet balances
    // Decrease sell asset balance
    wallet.balances[sellBalanceIndex].amount -= parseFloat(amount);
    wallet.balances[sellBalanceIndex].lastUpdated = Date.now();

    // Check if buy asset already exists in wallet
    const buyBalanceIndex = wallet.balances.findIndex(
      b => b.assetCode === buyCode && b.assetIssuer === buyIssuer
    );

    if (buyBalanceIndex !== -1) {
      // Increase existing buy asset balance
      wallet.balances[buyBalanceIndex].amount += parseFloat(pathInfo.destAmount);
      wallet.balances[buyBalanceIndex].lastUpdated = Date.now();
    } else {
      // Add new buy asset to wallet
      wallet.balances.push({
        assetCode: buyCode,
        assetIssuer: buyIssuer,
        amount: parseFloat(pathInfo.destAmount),
        lastUpdated: Date.now()
      });
    }

    await wallet.save();

    res.json({
      success: true,
      transaction,
      swap: {
        sellAsset: `${sellCode}${sellIssuer ? `:${sellIssuer}` : ''}`,
        buyAsset: `${buyCode}${buyIssuer ? `:${buyIssuer}` : ''}`,
        sellAmount: amount,
        buyAmount: pathInfo.destAmount,
        exchangeRate: parseFloat(pathInfo.destAmount) / parseFloat(amount),
        txHash: swapResult.hash
      }
    });
  } catch (err) {
    console.error('Error executing swap:', err);
    res.status(500).json({ msg: 'Error executing swap', error: err.message });
  }
};

// @desc    Get available trading pairs
// @route   GET /api/sdex/pairs
// @access  Private
exports.getTradingPairs = async (req, res) => {
  try {
    // In a real implementation, we would query the Stellar network
    // or maintain a database of popular trading pairs
    // For the hackathon, we'll return a static list of common pairs
    
    const pairs = [
      { baseAsset: 'XLM', counterAsset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
      { baseAsset: 'XLM', counterAsset: 'USD:GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX' },
      { baseAsset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', counterAsset: 'USD:GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX' },
      { baseAsset: 'XLM', counterAsset: 'BTC:GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF' },
      { baseAsset: 'XLM', counterAsset: 'ETH:GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR' },
      { baseAsset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', counterAsset: 'BTC:GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF' },
      { baseAsset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', counterAsset: 'ETH:GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR' }
    ];
    
    res.json(pairs);
  } catch (err) {
    console.error('Error getting trading pairs:', err);
    res.status(500).json({ msg: 'Error getting trading pairs', error: err.message });
  }
};

// @desc    Get historical prices for a trading pair
// @route   GET /api/sdex/history
// @access  Private
exports.getPriceHistory = async (req, res) => {
  const { baseAsset, counterAsset, resolution = 'day' } = req.query;
  
  if (!baseAsset || !counterAsset) {
    return res.status(400).json({ msg: 'Please provide baseAsset and counterAsset' });
  }

  try {
    // Parse asset codes and issuers
    const [baseCode, baseIssuer] = baseAsset.split(':');
    const [counterCode, counterIssuer] = counterAsset.split(':');

    // In a real implementation, we would query historical trade data
    // For the hackathon, we'll generate mock data
    
    const now = new Date();
    const data = [];
    
    // Generate 30 data points based on resolution
    let interval;
    switch (resolution) {
      case 'hour':
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case 'day':
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case 'week':
        interval = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      default:
        interval = 24 * 60 * 60 * 1000; // Default to 1 day
    }
    
    // Generate mock price data
    let basePrice = Math.random() * 10;
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(now.getTime() - (i * interval));
      // Add some random variation to the price
      basePrice = basePrice * (0.98 + Math.random() * 0.04);
      
      data.unshift({
        timestamp: timestamp.toISOString(),
        price: basePrice.toFixed(7),
        volume: Math.floor(Math.random() * 100000)
      });
    }
    
    res.json({
      baseAsset: `${baseCode}${baseIssuer ? `:${baseIssuer}` : ''}`,
      counterAsset: `${counterCode}${counterIssuer ? `:${counterIssuer}` : ''}`,
      resolution,
      data
    });
  } catch (err) {
    console.error('Error getting price history:', err);
    res.status(500).json({ msg: 'Error getting price history', error: err.message });
  }
};
