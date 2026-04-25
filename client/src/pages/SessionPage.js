import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { jobApi } from '../services/api';

const ROLE_COLORS = { orchestrator:'var(--orchestrator)', researcher:'var(--researcher)', writer:'var(--writer)', analyst:'var(--analyst)' };

export default function SessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobApi.getSession(id).then((r) => setSession(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div style={{ color:'var(--text-muted)', textAlign:'center', paddingTop:'3rem' }}>Loading...</div></Layout>;
  if (!session) return <Layout><div style={{ color:'var(--red)', textAlign:'center', paddingTop:'3rem' }}>Session not found</div></Layout>;

  const analysisData = (() => { try { return JSON.parse(session.analysisOutput); } catch { return null; } })();

  return (
    <Layout>
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom:'2rem' }}>
        <Link to="/" style={{ color:'var(--text-muted)', fontSize: 13 }}>← Dashboard</Link>
        <span style={{ color:'var(--text-muted)' }}>/</span>
        <span style={{ fontSize: 13, color:'var(--text-secondary)' }}>Session</span>
        <StatusBadge status={session.status} />
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>{session._id}</span>
      </div>

      {/* Prompt */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>User prompt</div>
        <div style={{ fontSize:15, fontWeight:500 }}>{session.userPrompt}</div>
        <div style={{ display:'flex', gap:'2rem', marginTop:'1rem' }}>
          {[
            ['Total jobs',   session.totalJobs],
            ['Completed',    session.completedJobs],
            ['Total USDC',   `$${(session.totalAmountUsdc||0).toFixed(4)}`],
            ['Duration',     session.durationMs ? `${session.durationMs}ms` : '—'],
          ].map(([l, v]) => (
            <div key={l}><div style={{ fontSize:11, color:'var(--text-muted)' }}>{l}</div><div style={{ fontSize:14, fontWeight:600 }}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* Job timeline */}
      <h2 style={{ fontSize:16, fontWeight:600, marginBottom:'1rem' }}>Agent Job Timeline</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'2rem' }}>
        {session.jobs?.map((job, i) => {
          const workerRole = job.workerAgent?.role || 'researcher';
          const color = ROLE_COLORS[workerRole] || 'var(--text-secondary)';
          return (
            <div key={job._id} style={{ background:'var(--bg-card)', border:`1px solid var(--border)`, borderLeft:`3px solid ${color}`, borderRadius:'var(--radius)', padding:'1rem 1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>#{i+1}</span>
                <span style={{ fontWeight:600, fontSize:14, color }}>
                  {job.workerAgent?.name || 'Agent'}
                </span>
                <span className="badge badge-purple" style={{ fontSize:11 }}>{job.taskType}</span>
                {job.durationMs && <span style={{ fontSize:11, color:'var(--text-muted)' }}>{job.durationMs}ms</span>}
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  <span style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>${job.amountUsdc?.toFixed(4)} USDC</span>
                  <StatusBadge status={job.status} small />
                </div>
              </div>
              {job.arcTxHash && (
                <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--mono)', marginBottom:8 }}>
                  Arc tx: <span style={{ color:'var(--accent)' }}>{job.arcTxHash}</span>
                  {' · '}Circle: <span style={{ color:'var(--accent)' }}>{job.circlePaymentId?.slice(0,16)}...</span>
                </div>
              )}
              <div style={{ background:'var(--bg-surface)', borderRadius:6, padding:'0.65rem 0.85rem', fontSize:12, color:'var(--text-secondary)', maxHeight:120, overflowY:'auto', lineHeight:1.6 }}>
                {job.outputPayload?.slice(0,400)}{job.outputPayload?.length > 400 ? '…' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analyst score card */}
      {analysisData && (
        <>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:'1rem' }}>Analyst Score</h2>
          <div className="card" style={{ marginBottom:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'2rem', marginBottom:'1rem' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:40, fontWeight:700, color: analysisData.quality_score >= 7 ? 'var(--green)' : analysisData.quality_score >= 5 ? 'var(--amber)' : 'var(--red)' }}>
                  {analysisData.quality_score}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>/ 10</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, marginBottom:8 }}>{analysisData.summary}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Confidence: {Math.round((analysisData.confidence||0)*100)}%</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {analysisData.strengths?.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--green)', marginBottom:6 }}>Strengths</div>
                  {analysisData.strengths.map((s, i) => <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:3 }}>✓ {s}</div>)}
                </div>
              )}
              {analysisData.improvements?.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--amber)', marginBottom:6 }}>Improvements</div>
                  {analysisData.improvements.map((s, i) => <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:3 }}>↑ {s}</div>)}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Final output */}
      {session.finalOutput && (
        <>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:'1rem' }}>Final Output</h2>
          <div className="card">
            <pre style={{ fontFamily:'var(--font)', fontSize:14, color:'var(--text-secondary)', lineHeight:1.7, whiteSpace:'pre-wrap', margin:0 }}>
              {session.finalOutput}
            </pre>
          </div>
        </>
      )}
    </Layout>
  );
}

function StatusBadge({ status, small }) {
  const map = { completed:['badge-green','✓ complete'], in_progress:['badge-amber','running'], failed:['badge-red','failed'], pending:['badge-purple','pending'] };
  const [cls, label] = map[status] || ['badge-purple', status];
  return <span className={`badge ${cls}`} style={small ? { fontSize:10 } : {}}>{label}</span>;
}
