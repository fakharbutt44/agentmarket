const jwt = require('jsonwebtoken');
const User = require('../models/User');
const WalletBalance = require('../models/WalletBalance');
const circleService = require('../services/circle.service');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);

  if (await User.findOne({ email })) throw new AppError('Email already registered', 409);

  // Create Circle wallet for the user
  let walletId = null, walletAddress = null;
  try {
    const wallet = await circleService.createWallet(`user-${email}`);
    walletId = wallet.walletId;
    walletAddress = wallet.address;
  } catch (err) {
    // Fallback for sandbox/mock
    walletId = `mock-user-${Date.now()}`;
    walletAddress = `0x${Math.random().toString(16).slice(2).padStart(40, '0')}`;
  }

  const user = await User.create({ name, email, password, circleWalletId: walletId, circleWalletAddress: walletAddress });
  await WalletBalance.create({ user: user._id, balanceUsdc: 0 });

  res.status(201).json({
    success: true,
    token: signToken(user._id),
    data: { id: user._id, name: user.name, email: user.email, circleWalletAddress: user.circleWalletAddress },
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid credentials', 401);

  res.json({
    success: true,
    token: signToken(user._id),
    data: { id: user._id, name: user.name, email: user.email, circleWalletId: user.circleWalletId, circleWalletAddress: user.circleWalletAddress },
  });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
});
