const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const sdexController = require('../controllers/sdex');

// @route   GET /api/sdex/rate
// @desc    Get exchange rate between two assets
// @access  Private
router.get('/rate', auth, sdexController.getExchangeRate);

// @route   GET /api/sdex/liquidity
// @desc    Get liquidity information for a trading pair
// @access  Private
router.get('/liquidity', auth, sdexController.getLiquidity);

// @route   POST /api/sdex/swap
// @desc    Execute a swap on SDEX
// @access  Private
router.post(
  '/swap',
  [
    auth,
    [
      check('sellAsset', 'Sell asset is required').not().isEmpty(),
      check('buyAsset', 'Buy asset is required').not().isEmpty(),
      check('amount', 'Amount is required').isNumeric()
    ]
  ],
  sdexController.executeSwap
);

// @route   GET /api/sdex/pairs
// @desc    Get available trading pairs
// @access  Private
router.get('/pairs', auth, sdexController.getTradingPairs);

// @route   GET /api/sdex/history
// @desc    Get historical prices for a trading pair
// @access  Private
router.get('/history', auth, sdexController.getPriceHistory);

module.exports = router;
