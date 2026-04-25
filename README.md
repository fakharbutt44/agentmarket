# AgentMarket ⬡

> **Agent-to-Agent Payment Marketplace** — autonomous AI agents hiring each other for tasks, paying in real-time USDC nanopayments settled on Arc blockchain.

Built for the **Agentic Economy on Arc Hackathon** (April 20–26, 2026)
Track: **Agent-to-Agent Payment Loop (Track 2)**

---

## What It Does

AgentMarket is a marketplace where AI agents autonomously hire, pay, and get paid for completing tasks — with every transaction settled on-chain via Circle Nanopayments on Arc.

**One user prompt triggers a full agent economy:**

```
User Prompt
    │
    ▼
Orchestrator (plans & delegates)
    ├──► ResearchAgent  ──► $0.001 USDC nanopayment on Arc
    ├──► WriterAgent    ──► $0.001 USDC nanopayment on Arc
    └──► AnalystAgent   ──► $0.001 USDC nanopayment on Arc
                                  │
                                  ▼
                         Final output + Arc tx hashes
```

**Why this is impossible with traditional gas fees:**
On Ethereum mainnet, a single transfer costs ~$2–$5 in gas. Charging $0.001 per agent job would mean losing $1.999–$4.999 on every transaction. Arc + Circle Nanopayments reduces settlement cost to near-zero, making sub-cent agent commerce economically viable for the first time.

---

## Demo

**Live demo:** `https://your-demo-url.railway.app`
**GitHub:** `https://github.com/yourusername/agentmarket`

### Hackathon Requirements

| Requirement | Status |
|---|---|
| Per-action price ≤ $0.01 | ✅ $0.001 USDC per agent job |
| 50+ on-chain transactions | ✅ Run `npm run demo` → 60+ transactions |
| Margin explanation | ✅ See "Why Arc" section below |
| Circle Developer Console proof | ✅ See demo video |
| Arc Block Explorer verification | ✅ All tx hashes in dashboard |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Arc (EVM-compatible L1) |
| Payments | Circle Nanopayments + Circle Wallets |
| Currency | USDC (native gas token on Arc) |
| Backend | Node.js + Express (MVC) |
| Database | MongoDB + Mongoose |
| Frontend | React 18 + React Router |
| Real-time | Socket.io (live agent activity feed) |
| AI (Orchestration) | Gemini 1.5 Flash (Google AI Studio) |
| AI (Fallback) | Featherless (Meta-Llama-3.1-8B) |

---

## Architecture

```
client/                          server/
├── src/                         ├── config/
│   ├── components/              │   ├── circle.js       # Circle API client
│   │   ├── agents/              │   └── database.js     # MongoDB connection
│   │   │   ├── AgentCard.js     ├── controllers/
│   │   │   └── LiveFeed.js      │   ├── auth.controller.js
│   │   └── common/              │   ├── wallet.controller.js
│   │       └── Layout.js        │   ├── job.controller.js
│   ├── context/                 │   ├── agent.controller.js
│   │   └── AuthContext.js       │   └── transaction.controller.js
│   ├── pages/                   ├── middleware/
│   │   ├── LoginPage.js         │   ├── auth.middleware.js
│   │   ├── RegisterPage.js      │   └── errorHandler.js
│   │   ├── DashboardPage.js     ├── models/
│   │   ├── RunPage.js           │   ├── User.js
│   │   ├── SessionPage.js       │   ├── Agent.js
│   │   └── TransactionsPage.js  │   ├── Job.js
│   └── services/                │   ├── Session.js
│       ├── api.js               │   └── WalletBalance.js
│       └── socket.js            ├── routes/
└── public/                      ├── services/
    └── index.html               │   ├── agents/
                                 │   │   ├── BaseAgent.js
                                 │   │   ├── OrchestratorAgent.js
                                 │   │   ├── ResearchAgent.js
                                 │   │   ├── WriterAgent.js
                                 │   │   └── AnalystAgent.js
                                 │   ├── ai.service.js
                                 │   ├── circle.service.js
                                 │   └── payment.service.js
                                 └── utils/
                                     ├── seed.js
                                     ├── demoRunner.js
                                     ├── logger.js
                                     ├── asyncHandler.js
                                     └── AppError.js
```

### Key design decisions

**Separation of concerns (MVC):**
- Controllers handle HTTP — validate input, call services, return responses
- Services contain all business logic — Circle API, AI calls, payment settlement
- Models define data shape and DB operations only
- Agent classes encapsulate each agent's behavior independently

**Atomic balance deduction:**
`WalletBalance.deductAtomic()` uses MongoDB `findOneAndUpdate` with a conditional (`balanceUsdc >= amount`) — prevents overdraft even under concurrent session requests.

**Non-blocking orchestration:**
`POST /api/jobs/run` responds immediately with a `sessionId` (202 Accepted), then runs the full 3-agent pipeline asynchronously. Frontend tracks progress via Socket.io events.

**On-chain settlement:**
Each agent job triggers a Circle transfer from the hiring agent's wallet to the worker agent's wallet. Every agent has its own Circle wallet on Arc — payments flow between wallets, not to a single platform address.

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Circle developer account (sandbox): [app.circle.com/developer](https://app.circle.com/developer)
- Google AI Studio key (free): [aistudio.google.com](https://aistudio.google.com)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/agentmarket
cd agentmarket
npm install
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/agentmarket
JWT_SECRET=your_secret_here

CIRCLE_API_KEY=your_circle_sandbox_key
CIRCLE_BASE_URL=https://api-sandbox.circle.com

GEMINI_API_KEY=your_gemini_key
FEATHERLESS_API_KEY=your_featherless_key

PRICE_PER_JOB=0.001
```

### 3. Seed the 4 agents

```bash
npm run seed
```

This creates the Orchestrator, ResearchAgent, WriterAgent, and AnalystAgent in MongoDB — each with their own Circle wallet on Arc.

### 4. Start development

```bash
npm run dev:full     # starts server :5000 + React :3000
```

### 5. Fire demo transactions (hackathon requirement)

```bash
npm run demo
```

Runs 20 sessions automatically = **60+ on-chain transactions**. Output:

```
🚀 AgentMarket Demo Runner
==================================================
Running 20 sessions = 60+ on-chain transactions

[1/20] "Explain how Circle Nanopayments differ from..."
  ⬡ Session: 6789abc...
  ✓ Done — 3 jobs, $0.0030 USDC

...

📊 Demo Complete
  Sessions: 20 passed, 0 failed
  On-chain transactions: 60
  Total USDC settled: $0.0600
  Avg cost per session: $0.0030 USDC

✅ Requirement check:
  Per-action price ≤ $0.01: $0.001 ✓
  50+ on-chain transactions: 60 ✓
  Traditional gas would cost: ~$150.00 (impossible at $0.001/call) ✓
```

---

## API Reference

### Auth
```
POST /api/auth/register     { name, email, password }
POST /api/auth/login        { email, password }
GET  /api/auth/me
```

### Wallet
```
GET  /api/wallet/balance
GET  /api/wallet/deposit-address
POST /api/wallet/simulate-deposit   { amount }   # testnet only
POST /api/wallet/sync
```

### Jobs (Agent Sessions)
```
POST /api/jobs/run          { prompt }   → 202 + sessionId
GET  /api/jobs/sessions
GET  /api/jobs/sessions/:id
GET  /api/jobs/stats
```

### Agents
```
GET  /api/agents
GET  /api/agents/:id
```

### Transactions
```
GET  /api/transactions
```

### Socket.io Events
```
session:started     { sessionId, prompt }
job:started         { sessionId, agent, task, step, totalSteps }
job:completed       { sessionId, agent, task, amountUsdc, arcTxHash, circlePaymentId, output }
session:completed   { sessionId, finalOutput, totalUsdc, totalJobs, durationMs }
session:failed      { sessionId, error }
```

---

## Why Arc + Circle Nanopayments

Traditional blockchain economics make per-agent-job pricing impossible:

| Network | Gas per transfer | Can charge $0.001/job? |
|---|---|---|
| Ethereum mainnet | ~$2–5 | ❌ Loses $1.999–$4.999 per tx |
| Polygon | ~$0.01–0.05 | ❌ Breaks even at best |
| Arc + Circle Nanopayments | ~$0.000x | ✅ Profitable at $0.001 |

Arc's architecture with USDC as native gas token + Circle Nanopayments eliminates the gas fee problem entirely. This unlocks:

- **Agent-to-agent commerce** — agents pay each other without human intervention
- **Per-call API pricing** — charge fractions of a cent, settle immediately
- **Autonomous economies** — agents earn, spend, and accumulate value independently
- **Real-time settlement** — no batching delays, every job is settled on-chain immediately

---

## Judging Criteria Mapping

| Criterion | How AgentMarket addresses it |
|---|---|
| **Application of technology** | Circle Wallets (one per agent), Nanopayments for every job, Arc for settlement, USDC as the unit of account |
| **Business value** | Enables a new economic primitive: agent labor markets. Any developer can deploy a specialist agent and earn USDC passively |
| **Originality** | Agent-to-agent hiring with on-chain payment proof — not just a payment gateway, a full labor market |
| **Presentation** | Live dashboard with real-time Socket.io feed, Arc tx hash display, analyst score card |

---

## Circle Product Feedback

*This section fulfills the required Circle Product Feedback submission field.*

### Products used

1. **Circle Wallets API** — used to provision one custodial wallet per agent (4 agents + 1 per user). The per-entity wallet model was the right fit for agent-to-agent payments because each payment flows from the hiring agent's wallet to the worker agent's wallet, creating a clear on-chain record of who paid whom.

2. **Circle Nanopayments** — the core primitive enabling $0.001 per agent job. Without nanopayments, per-job settlement at this price point would be economically impossible on any gas-based chain.

3. **Circle Transfers API (v1/transfers)** — used as the settlement mechanism for each agent job via wallet-to-wallet USDC transfers.

### What worked well

- **Sandbox onboarding** was fast — from API key to first wallet creation in under 20 minutes
- **Idempotency keys** on transfers made retry logic clean; we use `uuid v4` per job, so network failures never cause double-charges
- **Wallet balance API** returns clean structured data; the `availableBalances` array made balance checking straightforward
- **Error response format** is consistent — `error.response.data.message` is always populated, which made our error handling layer simple to write
- The **wallet-to-wallet transfer model** maps perfectly to agent-to-agent payment flows — no need for external addresses or on/off ramps in the demo

### What could improve

1. **Nanopayments SDK** — there is no dedicated Nanopayments SDK for Node.js yet. We used the transfers API as a proxy, but a first-class `NanopaymentClient` with batching support (e.g. settle 100 micropayments in one on-chain tx) would dramatically improve throughput for high-frequency agent calls.

2. **Wallet creation speed** — in the sandbox, wallet creation takes 1–3 seconds per wallet. For a marketplace that needs to provision a wallet on user registration, this adds latency to the signup flow. A `createWalletBatch` endpoint would help.

3. **Real-time webhook reliability** — we polled for transfer status rather than relying on webhooks because sandbox webhooks had occasional delivery delays. Production webhook delivery with retry guarantees and a webhook testing UI (similar to Stripe's) would remove the need for polling.

4. **Balance webhooks** — there is no event for "wallet balance dropped below X". For agent systems that need to auto-top-up when balance is low, a threshold-based balance alert webhook would be very useful.

5. **Transfer metadata search** — we store `circlePaymentId` in MongoDB for lookup, but it would be useful to query Circle's API by custom metadata fields (e.g. `jobId`, `sessionId`) rather than only by transfer ID. This would simplify reconciliation between Circle records and application records.

6. **Testnet USDC faucet** — during development we had to manually request testnet USDC. A self-serve faucet in the developer console (like Alchemy's) would reduce friction during hackathons.

### Overall rating: 9/10

Circle's Wallets + Nanopayments stack is exactly the right infrastructure for agent-to-agent commerce. The economics only work because Arc + USDC removes gas as a variable cost. The main gap is tooling for very-high-frequency micropayment patterns (batching, balance webhooks, SDK) — all solvable and clearly on the roadmap.

---

## Team

Built solo during the Agentic Economy on Arc Hackathon, April 20–26, 2026.

---

## License

MIT
