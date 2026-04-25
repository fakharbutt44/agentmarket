const BaseAgent = require('./BaseAgent');
const ResearchAgent = require('./ResearchAgent');
const WriterAgent = require('./WriterAgent');
const AnalystAgent = require('./AnalystAgent');
const Agent = require('../../models/Agent');
const Session = require('../../models/Session');
const paymentService = require('../payment.service');
const logger = require('../../utils/logger');

class OrchestratorAgent extends BaseAgent {
  /**
   * Main entry point — receives user prompt, coordinates all 3 specialist agents,
   * settles payments after each job, emits real-time events via Socket.io.
   */
  async orchestrate({ session, user, userWalletId, io }) {
    const emit = (event, data) => {
      if (io) io.emit(event, { sessionId: session._id, ...data });
    };

    const startTime = Date.now();

    try {
      await Session.findByIdAndUpdate(session._id, { status: 'in_progress' });
      emit('session:started', { prompt: session.userPrompt });

      // Load all specialist agents from DB
      const [researchDoc, writerDoc, analystDoc] = await Promise.all([
        Agent.findOne({ role: 'researcher' }),
        Agent.findOne({ role: 'writer' }),
        Agent.findOne({ role: 'analyst' }),
      ]);

      if (!researchDoc || !writerDoc || !analystDoc) {
        throw new Error('One or more specialist agents not found. Run: npm run seed');
      }

      const researcher = new ResearchAgent(researchDoc);
      const writer = new WriterAgent(writerDoc);
      const analyst = new AnalystAgent(analystDoc);

      // ── Step 1: Orchestrator hires ResearchAgent ──────────────────────────
      emit('job:started', { agent: researcher.name, task: 'research', step: 1, totalSteps: 3 });
      logger.info(`Orchestrator hiring ResearchAgent for session ${session._id}`);

      const researchJob = await researcher.executeJob({
        session,
        requestedBy: user._id,
        hiringAgent: this,
        taskType: 'research',
        inputPayload: session.userPrompt,
      });

      const researchPayment = await paymentService.settleJob({
        job: researchJob,
        userWalletId,
        hiringAgent: this.doc,
        workerAgent: researchDoc,
      });

      await Session.findByIdAndUpdate(session._id, {
        researchOutput: researchJob.outputPayload,
        $inc: { completedJobs: 1, totalAmountUsdc: researchDoc.pricePerJobUsdc },
      });

      emit('job:completed', {
        agent: researcher.name,
        task: 'research',
        step: 1,
        arcTxHash: researchPayment.arcTxHash,
        circlePaymentId: researchPayment.circlePaymentId,
        amountUsdc: researchDoc.pricePerJobUsdc,
        output: researchJob.outputPayload,
      });

      // ── Step 2: Orchestrator hires WriterAgent with research output ────────
      emit('job:started', { agent: writer.name, task: 'write', step: 2, totalSteps: 3 });
      logger.info(`Orchestrator hiring WriterAgent for session ${session._id}`);

      const writeJob = await writer.executeJob({
        session,
        requestedBy: user._id,
        hiringAgent: this,
        taskType: 'write',
        inputPayload: researchJob.outputPayload,
      });

      const writePayment = await paymentService.settleJob({
        job: writeJob,
        userWalletId,
        hiringAgent: this.doc,
        workerAgent: writerDoc,
      });

      await Session.findByIdAndUpdate(session._id, {
        writingOutput: writeJob.outputPayload,
        $inc: { completedJobs: 1, totalAmountUsdc: writerDoc.pricePerJobUsdc },
      });

      emit('job:completed', {
        agent: writer.name,
        task: 'write',
        step: 2,
        arcTxHash: writePayment.arcTxHash,
        circlePaymentId: writePayment.circlePaymentId,
        amountUsdc: writerDoc.pricePerJobUsdc,
        output: writeJob.outputPayload,
      });

      // ── Step 3: Orchestrator hires AnalystAgent to score the writing ───────
      emit('job:started', { agent: analyst.name, task: 'analyze', step: 3, totalSteps: 3 });
      logger.info(`Orchestrator hiring AnalystAgent for session ${session._id}`);

      const analyzeJob = await analyst.executeJob({
        session,
        requestedBy: user._id,
        hiringAgent: this,
        taskType: 'analyze',
        inputPayload: writeJob.outputPayload,
      });

      const analyzePayment = await paymentService.settleJob({
        job: analyzeJob,
        userWalletId,
        hiringAgent: this.doc,
        workerAgent: analystDoc,
      });

      await Session.findByIdAndUpdate(session._id, {
        analysisOutput: analyzeJob.outputPayload,
        $inc: { completedJobs: 1, totalAmountUsdc: analystDoc.pricePerJobUsdc },
      });

      emit('job:completed', {
        agent: analyst.name,
        task: 'analyze',
        step: 3,
        arcTxHash: analyzePayment.arcTxHash,
        circlePaymentId: analyzePayment.circlePaymentId,
        amountUsdc: analystDoc.pricePerJobUsdc,
        output: analyzeJob.outputPayload,
      });

      // ── Finalize session ───────────────────────────────────────────────────
      const totalUsdc =
        researchDoc.pricePerJobUsdc + writerDoc.pricePerJobUsdc + analystDoc.pricePerJobUsdc;

      const finalOutput = writeJob.outputPayload;

      await Session.findByIdAndUpdate(session._id, {
        $set: {
          finalOutput,
          status: 'completed',
          totalJobs: 3,
          completedJobs: 3,
          durationMs: Date.now() - startTime,
        },
      });

      emit('session:completed', {
        finalOutput,
        totalUsdc,
        totalJobs: 3,
        durationMs: Date.now() - startTime,
      });

      logger.info(`Session completed: ${session._id} | $${totalUsdc} USDC | ${Date.now() - startTime}ms`);

      return { finalOutput, totalUsdc, totalJobs: 3 };
    } catch (err) {
      await Session.findByIdAndUpdate(session._id, {
        status: 'failed',
        errorMessage: err.message,
        durationMs: Date.now() - startTime,
      });
      emit('session:failed', { error: err.message });
      throw err;
    }
  }
}

module.exports = OrchestratorAgent;
