/**
 * M-Pesa Remittance Routes
 * Handles routes for crypto to M-Pesa transfers for Tanzania
 */
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const mpesaRemittanceController = require('../controllers/mpesaRemittance');

// @route   POST /api/mpesa/send
// @desc    Send crypto to M-Pesa in Tanzania
// @access  Private
router.post(
  '/send',
  [
    auth,
    [
      check('amount', 'Amount is required').not().isEmpty(),
      check('amount', 'Amount must be a positive number').isFloat({ min: 0.000001 }),
      check('recipientPhone', 'Recipient phone number is required').not().isEmpty(),
      check('recipientName', 'Recipient name is required').not().isEmpty(),
      check('sourceCurrency', 'Source currency is required').not().isEmpty(),
      check('sourceCurrency', 'Source currency must be XLM or USDC').isIn(['XLM', 'USDC']),
    ]
  ],
  mpesaRemittanceController.sendCryptoToMpesa
);

// @route   GET /api/mpesa/status/:id
// @desc    Check M-Pesa remittance status
// @access  Private
router.get(
  '/status/:id',
  auth,
  mpesaRemittanceController.checkMpesaRemittanceStatus
);

module.exports = router;
