const mongoose = require('mongoose');

const walletBalanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balanceUsdc: { type: Number, required: true, default: 0, min: 0 },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Atomically deduct — prevents overdraft on concurrent sessions
walletBalanceSchema.statics.deductAtomic = async function (userId, amount) {
  const result = await this.findOneAndUpdate(
    { user: userId, balanceUsdc: { $gte: amount } },
    { $inc: { balanceUsdc: -amount } },
    { new: true }
  );
  if (!result) throw new Error('Insufficient USDC balance');
  return result;
};

module.exports = mongoose.model('WalletBalance', walletBalanceSchema);
