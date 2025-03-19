const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallets');
const auth = require('../middleware/auth');

// @route   GET api/wallets
// @desc    Get user's wallet
// @access  Private
router.get('/', auth, walletController.getUserWallet);

// @route   POST api/wallets
// @desc    Create a new wallet
// @access  Private
router.post('/', auth, walletController.createWallet);

// @route   GET api/wallets/balance
// @desc    Get wallet balance
// @access  Private
router.get('/balance', auth, walletController.getWalletBalance);

// @route   POST api/wallets/fund
// @desc    Fund wallet
// @access  Private
router.post('/fund', auth, walletController.fundWallet);

// @route   POST api/wallets/withdraw
// @desc    Withdraw from wallet
// @access  Private
router.post('/withdraw', auth, walletController.withdrawFromWallet);

// @route   POST api/wallets/swap
// @desc    Swap currencies
// @access  Private
router.post('/swap', auth, walletController.swapCurrencies);

module.exports = router;
