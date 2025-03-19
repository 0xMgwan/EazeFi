const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/users');
const auth = require('../middleware/auth');

// @route   GET api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', auth, userController.getAllUsers);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, userController.getUserById);

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('name', 'Name is required').optional(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('phoneNumber', 'Phone number is required').optional()
    ]
  ],
  userController.updateUser
);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private
router.delete('/:id', auth, userController.deleteUser);

// @route   PUT api/users/:id/payment-method
// @desc    Add or update payment method
// @access  Private
router.put(
  '/:id/payment-method',
  [
    auth,
    [
      check('type', 'Payment method type is required').isIn(['card', 'bank', 'mobile_money']),
      check('details', 'Payment method details are required').not().isEmpty()
    ]
  ],
  userController.updatePaymentMethod
);

module.exports = router;
