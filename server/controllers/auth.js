const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const stellarUtils = require('../utils/stellar');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phoneNumber, userType, country, preferredCurrency } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Create a new Stellar account (custodial by default)
    let stellarAccount;
    try {
      stellarAccount = await stellarUtils.createStellarAccount();
    } catch (err) {
      console.error('Error creating Stellar account:', err);
      return res.status(500).json({ errors: [{ msg: 'Error creating Stellar account' }] });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      phoneNumber,
      userType,
      country,
      preferredCurrency,
      stellarAccount: {
        publicKey: stellarAccount.publicKey,
        isCustodial: true
      }
    });

    // Save user
    await user.save();

    // Create wallet for the user
    const wallet = new Wallet({
      user: user._id,
      stellarAccount: {
        publicKey: stellarAccount.publicKey,
        isCustodial: true
      },
      balances: []
    });

    await wallet.save();

    // Create JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        country: user.country,
        preferredCurrency: user.preferredCurrency,
        stellarPublicKey: user.stellarAccount.publicKey
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    // Create JWT token
    const token = user.getSignedJwtToken();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        country: user.country,
        preferredCurrency: user.preferredCurrency,
        stellarPublicKey: user.stellarAccount?.publicKey
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      country: user.country,
      preferredCurrency: user.preferredCurrency,
      paymentMethods: user.paymentMethods,
      stellarPublicKey: user.stellarAccount?.publicKey
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
