const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactions');
const auth = require('../middleware/auth');

// @route   GET api/transactions
// @desc    Get user's transactions
// @access  Private
router.get('/', auth, transactionController.getUserTransactions);

// @route   GET api/transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', auth, transactionController.getTransactionById);

// @route   POST api/transactions/insurance
// @desc    Purchase transaction insurance
// @access  Private
router.post('/insurance', auth, transactionController.purchaseInsurance);

// @route   POST api/transactions/insurance/claim
// @desc    Claim insurance for delayed transaction
// @access  Private
router.post('/insurance/claim', auth, transactionController.claimInsurance);

module.exports = router;
