import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { txApi } from '../services/api';

const ROLE_COLORS = { orchestrator:'var(--orchestrator)', researcher:'var(--researcher)', writer:'var(--writer)', analyst:'var(--analyst)' };

export default function TransactionsPage() {
  const [txs, setTxs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    txApi.getAll(page)
      .then((r) => { setTxs(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'2rem' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:600, marginBottom:4 }}>On-Chain Transactions</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Every agent job = 1 Circle nanopayment settled on Arc blockchain</p>
        </div>
        <a href={`${process.env.REACT_APP_ARC_EXPLORER || 'https://explorer.arc-testnet.io'}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize:13 }}>
          Arc Explorer ↗
        </a>
      </div>

      {loading ? (
        <div style={{ color:'var(--text-muted)', textAlign:'center', paddingTop:'3rem' }}>Loading...</div>
      ) : txs.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⛓</div>
          <div style={{ fontSize:15, fontWeight:500, marginBottom:8 }}>No transactions yet</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:'1.5rem' }}>Run your first session to see on-chain payments</div>
          <Link to="/run" className="btn btn-primary">▶ Run Session</Link>
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:'1rem', padding:'0.75rem 1.25rem', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)' }}>
              {['Worker Agent','Task','Amount','Arc Tx Hash','Date'].map((h) => (
                <div key={h} style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</div>
              ))}
            </div>

            {txs.map((tx, i) => {
              const workerRole = tx.workerAgent?.role || 'researcher';
              const color = ROLE_COLORS[workerRole] || 'var(--text-secondary)';
              return (
                <div key={tx._id} style={{
                  display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:'1rem',
                  padding:'0.85rem 1.25rem',
                  borderBottom: i < txs.length-1 ? '1px solid var(--border)' : 'none',
                  transition:'background 0.1s',
                  alignItems: 'center',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Agent */}
                  <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
                    <span style={{ fontSize:13, fontWeight:500, color }}>{tx.workerAgent?.name || '—'}</span>
                  </div>
                  {/* Task */}
                  <div>
                    <span style={{ fontSize:12, padding:'2px 8px', borderRadius:20, background:`${color}15`, color }}>{tx.taskType}</span>
                  </div>
                  {/* Amount */}
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--green)' }}>
                    ${tx.amountUsdc?.toFixed(4)} USDC
                  </div>
                  {/* Arc hash */}
                  <div className="mono" style={{ fontSize:11, color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {tx.arcTxHash ? (
                      <a href={`${process.env.REACT_APP_ARC_EXPLORER || 'https://explorer.arc-testnet.io'}/tx/${tx.arcTxHash}`}
                        target="_blank" rel="noreferrer"
                        style={{ color:'var(--accent)' }}>
                        {tx.arcTxHash.slice(0, 14)}...
                      </a>
                    ) : <span style={{ color:'var(--text-muted)' }}>pending</span>}
                  </div>
                  {/* Date */}
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:'1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
              <span style={{ display:'flex', alignItems:'center', fontSize:13, color:'var(--text-muted)' }}>
                Page {page} of {pagination.pages}
              </span>
              <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
