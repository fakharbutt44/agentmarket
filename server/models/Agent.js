const mongoose = require('mongoose');

/**
 * Agent — represents one of the 4 specialist AI agents in the marketplace.
 * Each agent has its own Circle wallet and earns USDC for completed jobs.
 */
const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['orchestrator', 'researcher', 'writer', 'analyst'],
      required: true,
    },
    description: { type: String, required: true },
    // Each agent has its own Circle wallet on Arc
    circleWalletId: { type: String, default: null },
    circleWalletAddress: { type: String, default: null },
    pricePerJobUsdc: {
      type: Number,
      default: parseFloat(process.env.PRICE_PER_JOB || '0.001'),
      max: [0.01, 'Price per job cannot exceed $0.01'],
    },
    // Capabilities this agent can handle
    capabilities: [{ type: String }],
    // Stats
    totalJobsCompleted: { type: Number, default: 0 },
    totalEarnedUsdc: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    // AI provider config
    aiProvider: { type: String, enum: ['gemini', 'featherless'], default: 'gemini' },
    systemPrompt: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Agent', agentSchema);
