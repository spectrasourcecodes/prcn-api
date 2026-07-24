const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const logger = require('../utils/logger');
const { sendVerificationEmail } = require('../services/emailService');

// Register
exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, country, currency, password, referralCode } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  // Handle referral
  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) referredBy = referrer._id;
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    phone,
    country,
    currency,
    password,
    referredBy,
  });
  
  // Send verification email (optional)
  // await sendVerificationEmail(user);

  // ✅ CREATE WALLET FOR USER
  await Wallet.create({
    user: user._id,
    balance: 0,
    profitBalance: 0,
    referralBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  });


  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, fullName, email, role: user.role },
      token,
      refreshToken,
    },
  });
});

// Login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if locked
  if (user.isLocked()) {
    throw new AppError('Account locked due to multiple failed attempts. Please try again later.', 403);
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new AppError('Invalid credentials', 401);
  }

  // Reset login attempts on success
  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  res.json({
    success: true,
    data: {
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
      token,
      refreshToken,
    },
  });
});

// Refresh token
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }
  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Invalid refresh token', 401);
  }
  const newToken = generateToken(user);
  const newRefreshToken = generateRefreshToken(user);
  res.json({ success: true, token: newToken, refreshToken: newRefreshToken });
});

// Logout (client-side removes tokens)
exports.logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// Verify email (placeholder)
exports.verifyEmail = asyncHandler(async (req, res) => {
  // Implementation will use JWT token sent in email
  res.json({ success: true, message: 'Email verified' });
});