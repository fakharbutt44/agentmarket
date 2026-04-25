const Session = require('../models/Session');
const Job = require('../models/Job');
const Agent = require('../models/Agent');
const WalletBalance = require('../models/WalletBalance');
const mongoose = require('mongoose');
const OrchestratorAgent = require('../services/agents/OrchestratorAgent');
const paymentService = require('../services/payment.service');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const PRICE_PER_JOB = parseFloat(process.env.PRICE_PER_JOB || '0.001');
const SESSION_COST = PRICE_PER_JOB * 3; // 3 specialist agents per session

// POST /api/jobs/run
// The main endpoint — user submits a prompt, all 4 agents go to work
exports.runSession = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || prompt.trim().length < 5) throw new AppError('Prompt must be at least 5 characters', 400);
  if (prompt.length > 2000) throw new AppError('Prompt must be under 2000 characters', 400);

  // 1. Check user balance
  const balance = await paymentService.getBalance(req.user.id);
  if (balance < SESSION_COST) {
    throw new AppError(
      `Insufficient balance. Need $${SESSION_COST.toFixed(4)} USDC for this session (3 agent jobs × $${PRICE_PER_JOB}). Your balance: $${balance.toFixed(4)}`,
      402
    );
  }

  // 2. Reserve funds upfront (atomic deduction prevents overdraft)
  await paymentService.reserveSessionFunds(req.user.id, SESSION_COST);

  // 3. Create session record
  const session = await Session.create({
    user: req.user.id,
    userPrompt: prompt,
    totalJobs: 3,
    status: 'pending',
  });

  // 4. Load orchestrator agent
  const orchestratorDoc = await Agent.findOne({ role: 'orchestrator' });
  if (!orchestratorDoc) throw new AppError('Orchestrator agent not seeded. Run: npm run seed', 500);

  const orchestrator = new OrchestratorAgent(orchestratorDoc);

  // 5. Get Socket.io instance for real-time events
  const io = req.app.get('io');

  // 6. Respond immediately with session ID, then run async
  res.status(202).json({
    success: true,
    data: {
      sessionId: session._id,
      message: 'Session started. Listen to socket events or poll /api/jobs/sessions/:id',
      totalCost: SESSION_COST,
      currency: 'USDC',
    },
  });

  // 7. Run orchestration asynchronously (non-blocking)
  orchestrator
    .orchestrate({
      session,
      user: req.user,
      userWalletId: req.user.circleWalletId,
      io,
    })
    .catch((err) => {
      // Refund on failure
      paymentService.addBalance(req.user.id, SESSION_COST).catch(() => {});
    });
});

// GET /api/jobs/sessions — list user's sessions
exports.getSessions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);

  const [sessions, total] = await Promise.all([
    Session.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Session.countDocuments({ user: req.user.id }),
  ]);

  res.json({
    success: true,
    data: sessions,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// GET /api/jobs/sessions/:id — get single session with its jobs
exports.getSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, user: req.user.id }).lean();
  if (!session) throw new AppError('Session not found', 404);

  const jobs = await Job.find({ session: session._id })
    .populate('hiringAgent', 'name role')
    .populate('workerAgent', 'name role')
    .lean();

  res.json({ success: true, data: { ...session, jobs } });
});

// GET /api/jobs/stats — dashboard stats
exports.getStats = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const [sessionStats, jobsByAgent, recentSessions] = await Promise.all([
    Session.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalAmountUsdc' },
        },
      },
    ]),
    Job.aggregate([
      { $match: { requestedBy: userId } },
      { $group: { _id: '$workerAgent', count: { $sum: 1 }, totalPaid: { $sum: '$amountUsdc' } } },
      { $lookup: { from: 'agents', localField: '_id', foreignField: '_id', as: 'agent' } },
      { $unwind: '$agent' },
      { $project: { agentName: '$agent.name', agentRole: '$agent.role', count: 1, totalPaid: 1 } },
    ]),
    Session.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const totals = sessionStats.reduce(
    (acc, s) => ({ sessions: acc.sessions + s.count, spent: acc.spent + s.totalSpent }),
    { sessions: 0, spent: 0 }
  );

  res.json({
    success: true,
    data: {
      totalSessions: totals.sessions,
      totalSpentUsdc: totals.spent,
      totalJobs: totals.sessions * 3,
      byStatus: sessionStats,
      jobsByAgent,
      recentSessions,
    },
  });
});
