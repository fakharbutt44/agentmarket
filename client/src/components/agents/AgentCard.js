import React from 'react';

const ROLE_META = {
  orchestrator: { color: 'var(--orchestrator)', icon: '⬡', label: 'Orchestrator' },
  researcher:   { color: 'var(--researcher)',   icon: '◎', label: 'ResearchAgent' },
  writer:       { color: 'var(--writer)',       icon: '✦', label: 'WriterAgent' },
  analyst:      { color: 'var(--analyst)',      icon: '◈', label: 'AnalystAgent' },
};

export default function AgentCard({ agent, isActive = false, currentTask = null }) {
  const meta = ROLE_META[agent.role] || ROLE_META.orchestrator;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isActive ? meta.color : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '1rem 1.25rem',
      transition: 'all 0.2s',
      boxShadow: isActive ? `0 0 20px ${meta.color}22` : 'none',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${meta.color}22`,
          border: `1px solid ${meta.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: meta.color,
        }}>
          {meta.icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{agent.role}</div>
        </div>
        {isActive && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, animation: 'pulse-dot 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, color: meta.color, fontWeight: 500 }}>Active</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatPill label="Jobs done" value={agent.totalJobsCompleted} />
        <StatPill label="Earned" value={`$${(agent.totalEarnedUsdc || 0).toFixed(4)}`} color={meta.color} />
      </div>

      {/* Price */}
      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: meta.color, fontWeight: 600 }}>${agent.pricePerJobUsdc?.toFixed(4)}</span>
        {' '}USDC per job
      </div>

      {/* Current task */}
      {currentTask && (
        <div style={{
          marginTop: 10, padding: '6px 10px', borderRadius: 6,
          background: `${meta.color}11`, border: `1px solid ${meta.color}33`,
          fontSize: 12, color: meta.color,
        }}>
          ↳ {currentTask}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '5px 10px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
