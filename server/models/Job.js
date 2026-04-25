const mongoose = require('mongoose');

/**
 * Job — one unit of work that one agent hires another agent to complete.
 * Each job triggers exactly one Circle nanopayment on Arc.
 */
const jobSchema = new mongoose.Schema(
  {
    // The session that spawned this job
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    // Human user who initiated the top-level request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Which agent hired which agent
    hiringAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },
    workerAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },
    // Task details
    taskType: {
      type: String,
      enum: ['research', 'write', 'analyze', 'orchestrate'],
      required: true,
    },
    inputPayload: { type: String, required: true },   // what was sent to worker
    outputPayload: { type: String, default: null },    // what worker returned
    // Payment
    amountUsdc: { type: Number, required: true },
    circlePaymentId: { type: String, default: null },
    arcTxHash: { type: String, default: null },
    // Lifecycle
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String, default: null },
    durationMs: { type: Number, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ session: 1, createdAt: 1 });

module.exports = mongoose.model('Job', jobSchema);
