import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/',             icon: '⬡', label: 'Dashboard' },
  { to: '/run',          icon: '▶', label: 'Run Session' },
  { to: '/transactions', icon: '⛓', label: 'Transactions' },
];

const agentColors = {
  orchestrator: 'var(--orchestrator)',
  researcher:   'var(--researcher)',
  writer:       'var(--writer)',
  analyst:      'var(--analyst)',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent)', display:'flex',
              alignItems:'center', justifyContent:'center',
              fontSize: 16,
            }}>⬡</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>AgentMarket</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Arc · USDC · Nano</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.55rem 0.75rem', borderRadius: 8,
              fontSize: 14, fontWeight: 500, marginBottom: 2,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              transition: 'all 0.12s',
            })}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Agent legend */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agents</div>
          {Object.entries(agentColors).map(([role, color]) => (
            <div key={role} style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{role}</span>
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: '1rem 1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '1100px' }}>
        {children}
      </main>
    </div>
  );
}
