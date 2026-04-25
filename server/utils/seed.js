require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const circleService = require('../services/circle.service');
const logger = require('./logger');

const AGENTS = [
  {
    name: 'Orchestrator',
    role: 'orchestrator',
    description: 'Receives user requests, breaks them into subtasks, and hires specialist agents.',
    capabilities: ['task_planning', 'agent_coordination', 'result_assembly'],
    aiProvider: 'gemini',
    systemPrompt:
      'You are an orchestrator AI. Your job is to plan tasks, delegate to specialists, and assemble final results. Be concise and structured.',
    pricePerJobUsdc: 0.0,
  },
  {
    name: 'ResearchAgent',
    role: 'researcher',
    description: 'Specialist in gathering, summarizing, and structuring information on any topic.',
    capabilities: ['research', 'summarization', 'fact_extraction'],
    aiProvider: 'gemini',
    systemPrompt:
      'You are a research specialist AI. Given a topic or question, produce structured, factual, and well-organized research output with key facts, context, and relevant data points. Be thorough but concise.',
    pricePerJobUsdc: parseFloat(process.env.PRICE_PER_JOB || '0.001'),
  },
  {
    name: 'WriterAgent',
    role: 'writer',
    description: 'Specialist in transforming raw research into polished, readable content.',
    capabilities: ['writing', 'formatting', 'content_creation'],
    aiProvider: 'gemini',
    systemPrompt:
      'You are a professional writer AI. Given research data or notes, produce clear, engaging, well-structured written content. Use appropriate formatting, headers where needed, and ensure the output is polished and professional.',
    pricePerJobUsdc: parseFloat(process.env.PRICE_PER_JOB || '0.001'),
  },
  {
    name: 'AnalystAgent',
    role: 'analyst',
    description: 'Specialist in evaluating and scoring content quality with structured feedback.',
    capabilities: ['analysis', 'quality_scoring', 'feedback'],
    aiProvider: 'gemini',
    systemPrompt:
      'You are an analyst AI. Given content, evaluate its quality and return a JSON object with: quality_score (1-10), strengths (array of strings), improvements (array of strings), confidence (0.0-1.0), summary (one sentence). Return only valid JSON.',
    pricePerJobUsdc: parseFloat(process.env.PRICE_PER_JOB || '0.001'),
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agentmarket');
  logger.info('Connected to MongoDB');

  for (const agentData of AGENTS) {
    const existing = await Agent.findOne({ role: agentData.role });
    if (existing) {
      logger.info(`Agent already exists: ${agentData.name} — skipping`);
      continue;
    }

    logger.info(`Creating agent: ${agentData.name}...`);

    // Create a Circle wallet for each agent (except orchestrator which uses user wallet)
    let walletId = null;
    let walletAddress = null;

    if (agentData.role !== 'orchestrator') {
      try {
        const wallet = await circleService.createWallet(`agent-${agentData.role}`);
        walletId = wallet.walletId;
        walletAddress = wallet.address;
        logger.info(`  Wallet created: ${walletId}`);
      } catch (err) {
        logger.warn(`  Circle wallet creation failed (sandbox?): ${err.message}`);
        walletId = `mock-wallet-${agentData.role}-${Date.now()}`;
        walletAddress = `0x${Math.random().toString(16).slice(2).padStart(40, '0')}`;
      }
    }

    await Agent.create({ ...agentData, circleWalletId: walletId, circleWalletAddress: walletAddress });
    logger.info(`  Agent seeded: ${agentData.name}`);
  }

  logger.info('Seed complete.');
  await mongoose.disconnect();
};

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
