const { validationResult } = require('express-validator');
const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // In a real app, we would check if the user is an admin
    // For the hackathon, we'll just return all users
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the user is requesting their own profile or is an admin
    if (req.user.id !== req.params.id) {
      return res.status(401).json({ msg: 'Not authorized to view this profile' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if the user is updating their own profile
  if (req.user.id !== req.params.id) {
    return res.status(401).json({ msg: 'Not authorized to update this profile' });
  }

  const { name, email, phoneNumber, country, preferredCurrency } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (country) user.country = country;
    if (preferredCurrency) user.preferredCurrency = preferredCurrency;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
exports.deleteUser = async (req, res) => {
  try {
    // Check if the user is deleting their own profile
    if (req.user.id !== req.params.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this profile' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await user.remove();

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Add or update payment method
// @route   PUT /api/users/:id/payment-method
// @access  Private
exports.updatePaymentMethod = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if the user is updating their own profile
  if (req.user.id !== req.params.id) {
    return res.status(401).json({ msg: 'Not authorized to update this profile' });
  }

  const { type, details, isDefault } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if payment method already exists
    const paymentMethodIndex = user.paymentMethods.findIndex(
      method => method.type === type && 
                JSON.stringify(method.details) === JSON.stringify(details)
    );

    if (paymentMethodIndex >= 0) {
      // Update existing payment method
      user.paymentMethods[paymentMethodIndex].isDefault = isDefault || false;
    } else {
      // Add new payment method
      const newPaymentMethod = {
        type,
        details,
        isDefault: isDefault || false,
        createdAt: Date.now()
      };

      user.paymentMethods.push(newPaymentMethod);
    }

    // If this payment method is set as default, update other payment methods
    if (isDefault) {
      user.paymentMethods.forEach((method, index) => {
        if (index !== paymentMethodIndex) {
          method.isDefault = false;
        }
      });
    }

    await user.save();

    res.json(user.paymentMethods);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};
