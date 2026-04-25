const paymentService = require('../services/payment.service');
const circleService = require('../services/circle.service');
const WalletBalance = require('../models/WalletBalance');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /api/wallet/balance
exports.getBalance = asyncHandler(async (req, res) => {
  const balance = await paymentService.getBalance(req.user.id);
  const pricePerJob = parseFloat(process.env.PRICE_PER_JOB || '0.001');
  res.json({
    success: true,
    data: {
      balanceUsdc: balance,
      pricePerSession: pricePerJob * 3,
      estimatedSessionsRemaining: Math.floor(balance / (pricePerJob * 3)),
    },
  });
});

// GET /api/wallet/deposit-address
exports.getDepositAddress = asyncHandler(async (req, res) => {
  const { circleWalletId, circleWalletAddress } = req.user;
  if (!circleWalletId) throw new AppError('No wallet found', 404);
  res.json({
    success: true,
    data: { address: circleWalletAddress, network: 'Arc (EVM)', currency: 'USDC' },
  });
});

// POST /api/wallet/simulate-deposit  — testnet/demo only
exports.simulateDeposit = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') throw new AppError('Not available in production', 403);

  const amount = parseFloat(req.body.amount || 1.0);
  if (amount <= 0 || amount > 100) throw new AppError('Amount must be 0–100', 400);

  await paymentService.addBalance(req.user.id, amount);
  const balance = await paymentService.getBalance(req.user.id);

  res.json({ success: true, data: { deposited: amount, newBalance: balance } });
});

// POST /api/wallet/sync — pull live balance from Circle
exports.syncBalance = asyncHandler(async (req, res) => {
  const { circleWalletId } = req.user;
  if (!circleWalletId) throw new AppError('No wallet found', 404);

  let liveBalance;
  try {
    liveBalance = await circleService.getWalletBalance(circleWalletId);
  } catch {
    liveBalance = await paymentService.getBalance(req.user.id);
  }

  await WalletBalance.findOneAndUpdate(
    { user: req.user.id },
    { balanceUsdc: liveBalance, lastSyncedAt: new Date() },
    { upsert: true }
  );

  res.json({ success: true, data: { balanceUsdc: liveBalance } });
});
