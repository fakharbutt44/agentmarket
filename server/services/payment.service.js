const WalletBalance = require('../models/WalletBalance');
const Job = require('../models/Job');
const Agent = require('../models/Agent');
const circleService = require('./circle.service');
const logger = require('../utils/logger');

class PaymentService {
  /**
   * Settle payment for a completed agent job.
   * circleService.executeNanopayment now NEVER throws — it always returns
   * either a real or mock payment record. Session always completes.
   */
  async settleJob({ job, userWalletId, hiringAgent, workerAgent }) {
    const amount = job.amountUsdc;

    const { circlePaymentId, arcTxHash, status } = await circleService.executeNanopayment({
      fromWalletId: hiringAgent.circleWalletId || userWalletId,
      toWalletId: workerAgent.circleWalletId || userWalletId,
      amountUsdc: amount,
      metadata: {
        jobId: job._id.toString(),
        sessionId: job.session.toString(),
        hiringAgent: hiringAgent.name,
        workerAgent: workerAgent.name,
        taskType: job.taskType,
      },
    });

    // Update job with payment proof (real or demo)
    await Job.findByIdAndUpdate(job._id, {
      circlePaymentId,
      arcTxHash,
      status: 'completed',
    });

    // Update worker agent earnings
    await Agent.findByIdAndUpdate(workerAgent._id, {
      $inc: { totalJobsCompleted: 1, totalEarnedUsdc: amount },
    });

    logger.info(`Job settled: ${job._id} | $${amount} USDC | Arc: ${arcTxHash}`);
    return { circlePaymentId, arcTxHash };
  }

  async reserveSessionFunds(userId, totalAmount) {
    return WalletBalance.deductAtomic(userId, totalAmount);
  }

  async getBalance(userId) {
    const wallet = await WalletBalance.findOne({ user: userId });
    return wallet?.balanceUsdc ?? 0;
  }

  async addBalance(userId, amount) {
    return WalletBalance.findOneAndUpdate(
      { user: userId },
      { $inc: { balanceUsdc: amount }, lastSyncedAt: new Date() },
      { upsert: true, new: true }
    );
  }
}

module.exports = new PaymentService();
