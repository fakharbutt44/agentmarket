const mongoose = require('mongoose');

/**
 * Session — represents one end-to-end user request.
 * The Orchestrator creates a session then spawns 3 jobs (research, write, analyze).
 * Total cost = 3 nanopayments = $0.003 USDC per session.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userPrompt: { type: String, required: true },
    // Final assembled output from all agents
    finalOutput: { type: String, default: null },
    // Aggregated results from each specialist
    researchOutput: { type: String, default: null },
    writingOutput: { type: String, default: null },
    analysisOutput: { type: String, default: null },
    // Payment summary
    totalAmountUsdc: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
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

module.exports = mongoose.model('Session', sessionSchema);
