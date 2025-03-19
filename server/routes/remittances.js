const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const remittanceController = require('../controllers/remittances');
const auth = require('../middleware/auth');

// @route   POST api/remittances/send
// @desc    Send remittance
// @access  Private
router.post(
  '/send',
  [
    auth,
    [
      check('amount', 'Amount is required').isNumeric(),
      check('recipientPhone', 'Recipient phone number is required').not().isEmpty(),
      check('sourceCurrency', 'Source currency is required').not().isEmpty(),
      check('targetCurrency', 'Target currency is required').not().isEmpty(),
      check('paymentMethod', 'Payment method is required').not().isEmpty(),
      check('includeInsurance', 'Insurance option is required').isBoolean()
    ]
  ],
  remittanceController.sendRemittance
);

// @route   GET api/remittances
// @desc    Get user's remittances
// @access  Private
router.get('/', auth, remittanceController.getUserRemittances);

// @route   GET api/remittances/:id
// @desc    Get remittance by ID
// @access  Private
router.get('/:id', auth, remittanceController.getRemittanceById);

// @route   POST api/remittances/redeem
// @desc    Redeem remittance
// @access  Private
router.post(
  '/redeem',
  [
    auth,
    [
      check('remittanceId', 'Remittance ID is required').not().isEmpty(),
      check('redeemMethod', 'Redeem method is required').not().isEmpty(),
      check('accountNumber', 'Account number is required').not().isEmpty()
    ]
  ],
  remittanceController.redeemRemittance
);

// @route   POST api/remittances/family-pool/create
// @desc    Create a family pool
// @access  Private
router.post(
  '/family-pool/create',
  [
    auth,
    [
      check('name', 'Pool name is required').not().isEmpty(),
      check('members', 'Members are required').isArray(),
      check('withdrawalLimit', 'Withdrawal limit is required').isNumeric()
    ]
  ],
  remittanceController.createFamilyPool
);

// @route   POST api/remittances/family-pool/contribute
// @desc    Contribute to a family pool
// @access  Private
router.post(
  '/family-pool/contribute',
  [
    auth,
    [
      check('poolId', 'Pool ID is required').not().isEmpty(),
      check('amount', 'Amount is required').isNumeric(),
      check('sourceCurrency', 'Source currency is required').not().isEmpty(),
      check('paymentMethod', 'Payment method is required').not().isEmpty()
    ]
  ],
  remittanceController.contributeToFamilyPool
);

// @route   POST api/remittances/family-pool/withdraw
// @desc    Withdraw from a family pool
// @access  Private
router.post(
  '/family-pool/withdraw',
  [
    auth,
    [
      check('poolId', 'Pool ID is required').not().isEmpty(),
      check('amount', 'Amount is required').isNumeric(),
      check('redeemMethod', 'Redeem method is required').not().isEmpty(),
      check('accountNumber', 'Account number is required').not().isEmpty()
    ]
  ],
  remittanceController.withdrawFromFamilyPool
);

module.exports = router;
