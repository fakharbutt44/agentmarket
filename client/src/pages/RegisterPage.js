import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⬡</div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>AgentMarket</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Create your account</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: '1.5rem' }}>Get started</h2>

          {error && (
            <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 8, padding: '0.65rem 1rem', fontSize: 13, color: 'var(--red)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handle}>
            {[
              { key: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { key: 'password', label: 'Password', type: 'password', placeholder: '8+ characters' },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
                <input className="input" type={f.type} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} required />
              </div>
            ))}

            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--accent-light)', borderRadius: 8, fontSize: 12, color: 'var(--accent)' }}>
              A Circle wallet on Arc blockchain is created automatically for your account.
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 14, color: 'var(--text-secondary)' }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
