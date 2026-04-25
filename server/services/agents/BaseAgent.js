const aiService = require('../ai.service');
const Job = require('../../models/Job');
const logger = require('../../utils/logger');

/**
 * BaseAgent — all 4 agents extend this.
 * Handles the job lifecycle: create → execute → complete.
 */
class BaseAgent {
  constructor(agentDoc) {
    this.doc = agentDoc; // Mongoose Agent document
  }

  get id() { return this.doc._id; }
  get name() { return this.doc.name; }
  get role() { return this.doc.role; }
  get walletId() { return this.doc.circleWalletId; }
  get pricePerJob() { return this.doc.pricePerJobUsdc; }

  /**
   * Create a job record and execute the task.
   * Returns the completed Job document.
   */
  async executeJob({ session, requestedBy, hiringAgent, taskType, inputPayload }) {
    const startTime = Date.now();

    // Create job record
    const job = await Job.create({
      session: session._id,
      requestedBy,
      hiringAgent: hiringAgent.id,
      workerAgent: this.id,
      taskType,
      inputPayload,
      amountUsdc: this.pricePerJob,
      status: 'in_progress',
    });

    try {
      // Run the actual AI task
      const output = await this.run(inputPayload, session);

      // Mark job complete with output
      await Job.findByIdAndUpdate(job._id, {
        outputPayload: output,
        status: 'completed',
        durationMs: Date.now() - startTime,
      });

      job.outputPayload = output;
      job.status = 'completed';
      job.durationMs = Date.now() - startTime;

      logger.info(`Job completed: ${job._id} | ${this.name} | ${job.durationMs}ms`);
      return job;
    } catch (err) {
      await Job.findByIdAndUpdate(job._id, {
        status: 'failed',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });
      throw err;
    }
  }

  /**
   * Override in subclasses with the actual AI logic.
   */
  async run(input, session) {
    throw new Error(`run() not implemented in ${this.constructor.name}`);
  }
}

module.exports = BaseAgent;
