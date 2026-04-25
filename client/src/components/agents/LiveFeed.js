import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';

const ROLE_COLORS = {
  orchestrator: 'var(--orchestrator)',
  researcher:   'var(--researcher)',
  writer:       'var(--writer)',
  analyst:      'var(--analyst)',
};
const TASK_ICONS = { research: '◎', write: '✦', analyze: '◈', orchestrate: '⬡' };

export default function LiveFeed({ sessionId, onComplete }) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('waiting'); // waiting | running | done | failed
  const bottomRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();

    const add = (ev) =>
      setEvents((prev) => [...prev, { ...ev, ts: new Date().toLocaleTimeString() }]);

    const matches = (d) => String(d.sessionId) === String(sessionId);

    socket.on('session:started',   (d) => { if (matches(d)) { add({ type: 'started', ...d }); setStatus('running'); } });
    socket.on('job:started',       (d) => { if (matches(d)) add({ type: 'job_started', ...d }); });
    socket.on('job:completed',     (d) => { if (matches(d)) add({ type: 'job_done', ...d }); });
    socket.on('session:completed', (d) => { if (matches(d)) { add({ type: 'completed', ...d }); setStatus('done'); onComplete?.(d); } });
    socket.on('session:failed',    (d) => { if (matches(d)) { add({ type: 'failed', ...d }); setStatus('failed'); } });

    return () => {
      socket.off('session:started');
      socket.off('job:started');
      socket.off('job:completed');
      socket.off('session:completed');
      socket.off('session:failed');
    };
  }, [sessionId, onComplete]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: status === 'running' ? 'var(--green)' : status === 'done' ? 'var(--green)' : status === 'failed' ? 'var(--red)' : 'var(--text-muted)',
          animation: status === 'running' ? 'pulse-dot 1s infinite' : 'none',
        }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {status === 'waiting' ? 'Waiting for agents...' : status === 'running' ? 'Agents working...' : status === 'done' ? 'Session complete' : 'Session failed'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
          {events.length} events
        </span>
      </div>

      {/* Event stream */}
      <div style={{ height: 320, overflowY: 'auto', padding: '0.75rem' }}>
        {events.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, paddingTop: 40 }}>
            Session started — agent activity will appear here in real time
          </div>
        )}
        {events.map((ev, i) => (
          <EventRow key={i} event={ev} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function EventRow({ event }) {
  const agentColor = event.agent
    ? Object.entries(ROLE_COLORS).find(([role]) => event.agent?.toLowerCase().includes(role))?.[1] || 'var(--text-secondary)'
    : 'var(--text-muted)';

  if (event.type === 'started') return (
    <div className="animate-in" style={{ display:'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>{event.ts}</span>
      <span style={{ fontSize: 13, color: 'var(--green)' }}>⬡ Orchestrator received task: <em style={{ color: 'var(--text-secondary)' }}>"{event.prompt?.slice(0, 60)}..."</em></span>
    </div>
  );

  if (event.type === 'job_started') return (
    <div className="animate-in" style={{ display:'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>{event.ts}</span>
      <span style={{ fontSize: 13 }}>
        <span style={{ color: 'var(--orchestrator)' }}>Orchestrator</span>
        <span style={{ color: 'var(--text-muted)' }}> hired </span>
        <span style={{ color: agentColor }}>{event.agent}</span>
        <span style={{ color: 'var(--text-muted)' }}> for </span>
        <span style={{ color: 'var(--text-primary)' }}>{TASK_ICONS[event.task]} {event.task}</span>
        <span style={{ color: 'var(--text-muted)' }}> (step {event.step}/{event.totalSteps})</span>
      </span>
    </div>
  );

  if (event.type === 'job_done') return (
    <div className="animate-in" style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', gap: 10, alignItems: 'flex-start', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>{event.ts}</span>
        <span style={{ fontSize: 13 }}>
          <span style={{ color: agentColor }}>✓ {event.agent}</span>
          <span style={{ color: 'var(--text-muted)' }}> completed — paid </span>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>${event.amountUsdc?.toFixed(4)} USDC</span>
        </span>
      </div>
      {event.arcTxHash && (
        <div style={{ marginLeft: 80, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
          Arc: <span style={{ color: 'var(--accent)' }}>{event.arcTxHash?.slice(0, 20)}...</span>
        </div>
      )}
    </div>
  );

  if (event.type === 'completed') return (
    <div className="animate-in" style={{ display:'flex', gap: 10, marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>{event.ts}</span>
      <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
        ✓ All agents done — {event.totalJobs} jobs, ${event.totalUsdc?.toFixed(4)} USDC, {event.durationMs}ms
      </span>
    </div>
  );

  if (event.type === 'failed') return (
    <div className="animate-in" style={{ display:'flex', gap: 10, marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>{event.ts}</span>
      <span style={{ fontSize: 13, color: 'var(--red)' }}>✗ Session failed: {event.error}</span>
    </div>
  );

  return null;
}
