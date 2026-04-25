import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import AgentCard from '../components/agents/AgentCard';
import LiveFeed from '../components/agents/LiveFeed';
import { jobApi, agentApi, walletApi } from '../services/api';
import { getSocket } from '../services/socket';

const EXAMPLE_PROMPTS = [
  'Explain how Circle Nanopayments enable sub-cent transactions on Arc blockchain',
  'What are the top business models for agent-to-agent commerce in 2025?',
  'Write a technical overview of EVM-compatible L1 blockchains',
  'Analyze the market opportunity for micropayment APIs in AI agent systems',
];

export default function RunPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [agents, setAgents] = useState([]);
  const [balance, setBalance] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [currentTask, setCurrentTask] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PRICE_PER_SESSION = 0.003;

  useEffect(() => {
    Promise.all([agentApi.getAll(), walletApi.getBalance()]).then(([a, b]) => {
      setAgents(a.data.data);
      setBalance(b.data.data.balanceUsdc);
    });
  }, []);

  // Listen to socket events to highlight active agent
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();

    socket.on('job:started', (d) => {
      if (String(d.sessionId) !== String(sessionId)) return;
      setActiveAgent(d.agent);
      setCurrentTask((prev) => ({ ...prev, [d.agent]: `Running ${d.task}... (step ${d.step}/${d.totalSteps})` }));
    });
    socket.on('job:completed', (d) => {
      if (String(d.sessionId) !== String(sessionId)) return;
      setCurrentTask((prev) => ({ ...prev, [d.agent]: null }));
    });
    socket.on('session:completed', (d) => {
      if (String(d.sessionId) !== String(sessionId)) return;
      setActiveAgent(null);
    });

    return () => { socket.off('job:started'); socket.off('job:completed'); socket.off('session:completed'); };
  }, [sessionId]);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    setSessionId(null);
    setActiveAgent(null);
    setCurrentTask({});

    try {
      const res = await jobApi.run(prompt);
      setSessionId(res.data.data.sessionId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (data) => {
    setResult(data);
    walletApi.getBalance().then((b) => setBalance(b.data.data.balanceUsdc));
  };

  const canRun = balance >= PRICE_PER_SESSION && prompt.trim().length >= 5 && !loading && !sessionId;

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Run Session</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          One prompt → Orchestrator hires 3 specialist agents → 3 on-chain USDC nanopayments
        </p>
      </div>

      {/* Flow diagram */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
          {[
            { label: 'You', sub: 'prompt', color: 'var(--text-secondary)' },
            null,
            { label: 'Orchestrator', sub: 'plans & hires', color: 'var(--orchestrator)' },
            null,
            { label: 'Researcher', sub: '$0.001 USDC', color: 'var(--researcher)' },
            { label: 'Writer', sub: '$0.001 USDC', color: 'var(--writer)' },
            { label: 'Analyst', sub: '$0.001 USDC', color: 'var(--analyst)' },
          ].map((item, i) =>
            item === null ? (
              <div key={i} style={{ color: 'var(--text-muted)', fontSize: 18, padding: '0 8px' }}>→</div>
            ) : (
              <div key={i} style={{ textAlign: 'center', padding: '6px 12px', borderRadius: 8, background: `${item.color}15`, border: `1px solid ${item.color}33` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</div>
              </div>
            )
          )}
          <div style={{ marginLeft: 'auto', textAlign: 'right', paddingLeft: '1rem', borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Session cost</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)' }}>${PRICE_PER_SESSION.toFixed(4)} USDC</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: input + feed */}
        <div>
          {/* Prompt input */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Your prompt</label>
            <textarea
              className="input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything — agents will research, write, and analyze..."
              disabled={!!sessionId && !result}
              style={{ resize: 'vertical', minHeight: 100 }}
            />

            {/* Example prompts */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Examples:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EXAMPLE_PROMPTS.map((p) => (
                  <button key={p} onClick={() => setPrompt(p)} style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '4px 10px', fontSize: 11,
                    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s',
                    textAlign: 'left',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {p.slice(0, 40)}…
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, color: 'var(--red)' }}>{error}</div>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <span style={{ fontSize: 13, color: balance >= PRICE_PER_SESSION ? 'var(--green)' : 'var(--red)' }}>
                Balance: ${balance.toFixed(4)} USDC
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {result && (
                  <button className="btn btn-ghost" onClick={() => { setSessionId(null); setResult(null); setPrompt(''); }}>
                    New session
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleRun} disabled={!canRun}>
                  {loading ? 'Starting...' : sessionId && !result ? 'Running...' : '▶ Run'}
                </button>
              </div>
            </div>
          </div>

          {/* Live feed */}
          {sessionId && <LiveFeed sessionId={sessionId} onComplete={handleComplete} />}
        </div>

        {/* Right: agent cards + result */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {agents.map((a) => (
              <AgentCard
                key={a._id}
                agent={a}
                isActive={activeAgent === a.name}
                currentTask={currentTask[a.name] || null}
              />
            ))}
          </div>

          {/* Final result */}
          {result && (
            <div className="card animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Final Output</span>
                <span className="badge badge-green" style={{ marginLeft: 'auto' }}>3 jobs · ${result.totalUsdc?.toFixed(4)} USDC</span>
              </div>
              <div style={{
                background: 'var(--bg-surface)', borderRadius: 8,
                padding: '1rem', fontSize: 13, color: 'var(--text-secondary)',
                lineHeight: 1.7, maxHeight: 340, overflowY: 'auto',
                whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)',
              }}>
                {result.finalOutput}
              </div>
              <button
                className="btn btn-ghost"
                style={{ marginTop: '0.75rem', fontSize: 12 }}
                onClick={() => navigate(`/sessions/${sessionId}`)}
              >
                View full session details →
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
