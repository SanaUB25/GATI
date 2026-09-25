import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

export function Login() {
  const { signIn } = useAuth(); const navigate = useNavigate(); const [form, setForm] = useState({ email: 'control@railvista.local', password: 'password123' }); const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); setError(''); try { const { data } = await api.post('/auth/login', form); signIn(data.data.user, data.data.token); navigate('/dashboard'); } catch (requestError) { setError(requestError.response?.data?.detail || 'Unable to sign in'); } }
  return <main className="login-shell"><section className="login-panel"><p className="eyebrow">RAILVISTA / CONTROL CENTER</p><h1>Plan maintenance with confidence.</h1><p className="muted">Coordinate possessions across Engineering, S&T, and TRD with evidence-backed alternatives.</p><form onSubmit={submit}><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>{error && <p className="error">{error}</p>}<button className="primary" type="submit">Enter control center</button></form></section></main>;
}
