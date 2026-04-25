const Agent = require('../models/Agent');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /api/agents — list all agents with stats
exports.getAgents = asyncHandler(async (req, res) => {
  const agents = await Agent.find().select('-systemPrompt').lean();
  res.json({ success: true, data: agents });
});

// GET /api/agents/:id
exports.getAgent = asyncHandler(async (req, res) => {
  const agent = await Agent.findById(req.params.id).lean();
  if (!agent) throw new AppError('Agent not found', 404);
  res.json({ success: true, data: agent });
});
