const Job = require('../models/Job');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/transactions — all settled jobs (on-chain transactions)
exports.getTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);

  const [jobs, total] = await Promise.all([
    Job.find({ requestedBy: req.user.id, status: 'completed' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('hiringAgent', 'name role')
      .populate('workerAgent', 'name role')
      .lean(),
    Job.countDocuments({ requestedBy: req.user.id, status: 'completed' }),
  ]);

  res.json({
    success: true,
    data: jobs,
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});
