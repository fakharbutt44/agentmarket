import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/common/Layout';
import AgentCard from '../components/agents/AgentCard';
import { jobApi, agentApi, walletApi } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([jobApi.getStats(), agentApi.getAll(), walletApi.getBalance()])
      .then(([s, a, b]) => {
        setStats(s.data.data);
        setAgents(a.data.data);
        setBalance(b.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSimDeposit = async () => {
    await walletApi.simulateDeposit(0.1);
    const b = await walletApi.getBalance();
    setBalance(b.data.data);
  };

  if (loading) return <Layout><div style={{ color: 'var(--text-muted)', paddingTop: '3rem', textAlign: 'center' }}>Loading...</div></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Agent-to-agent marketplace on Arc blockchain</p>
        </div>
        <Link to="/run" className="btn btn-primary">▶ Run Session</Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Sessions', value: stats?.totalSessions ?? 0, color: 'var(--accent)' },
          { label: 'Agent Jobs Run', value: stats?.totalJobs ?? 0, color: 'var(--blue)' },
          { label: 'USDC Spent', value: `$${(stats?.totalSpentUsdc ?? 0).toFixed(4)}`, color: 'var(--green)' },
          { label: 'Wallet Balance', value: `$${(balance?.balanceUsdc ?? 0).toFixed(4)}`, color: 'var(--amber)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Balance card with deposit */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>USDC Balance on Arc</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--green)' }}>${(balance?.balanceUsdc ?? 0).toFixed(4)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            ≈ {balance?.estimatedSessionsRemaining ?? 0} sessions remaining
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-green" onClick={handleSimDeposit}>+ Add $0.10 (demo)</button>
          <button className="btn btn-ghost" onClick={async () => { const b = await walletApi.sync(); setBalance({ balanceUsdc: b.data.data.balanceUsdc }); }}>↻ Sync</button>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Deposit address (Arc)</div>
          <div className="mono" style={{ color: 'var(--accent)', fontSize: 11 }}>Use deposit-address endpoint</div>
        </div>
      </div>

      {/* Agents grid */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Active Agents</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {agents.map((a) => <AgentCard key={a._id} agent={a} />)}
      </div>

      {/* Recent sessions */}
      {stats?.recentSessions?.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Sessions</h2>
            <Link to="/transactions" style={{ fontSize: 13, color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.recentSessions.map((s) => (
              <Link key={s._id} to={`/sessions/${s._id}`} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.9rem 1.25rem',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', transition: 'border-color 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-med)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <StatusDot status={s.status} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.userPrompt}
                </span>
                <span style={{ fontSize: 12, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                  ${(s.totalAmountUsdc || 0).toFixed(4)} USDC
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}

function StatusDot({ status }) {
  const colors = { completed: 'var(--green)', in_progress: 'var(--amber)', failed: 'var(--red)', pending: 'var(--text-muted)' };
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] || 'var(--text-muted)', flexShrink: 0 }} />;
}
