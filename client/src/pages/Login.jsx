import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${isRegister ? 'register' : 'login'}`, form);
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot reach server. If this is the first request, wait 30 seconds and retry.');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 bg-white';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center p-6">
      <h1 className="text-3xl font-bold mb-1">💰 PaisaTrack</h1>
      <p className="text-slate-500 mb-6">{isRegister ? 'Create your account' : 'Welcome back'}</p>
      <form onSubmit={submit} className="space-y-3">
        {isRegister && <input className={input} placeholder="Name" onChange={set('name')} required />}
        <input className={input} type="email" placeholder="Email" onChange={set('email')} required />
        <input className={input} type="password" placeholder="Password (min 6)" onChange={set('password')} required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60">
          {loading ? 'Please wait...' : isRegister ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <button className="mt-4 text-sm text-indigo-600" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Already have an account? Log in' : 'New here? Create account'}
      </button>
    </div>
  );
}