import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ email, password });
      loginUser({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#1A141F' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12" style={{ backgroundColor: '#003A26' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#94ECBE' }}>
            <span className="text-sm font-black" style={{ color: '#1A141F' }}>T</span>
          </div>
          <span className="text-white text-lg font-bold tracking-wide">TaskFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage every<br />store launch,<br />end to end.
          </h2>
          <p className="text-sm" style={{ color: '#94ECBE' }}>
            From LOI to launch day — all tasks,<br />all teams, one platform.
          </p>
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} TaskFlow</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#94ECBE' }}>
              <span className="text-xs font-black" style={{ color: '#1A141F' }}>T</span>
            </div>
            <span className="text-white text-base font-bold">TaskFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-white/40 mb-8">Sign in to your account</p>

          {error && (
            <div className="rounded-xl p-3 mb-6 text-sm" style={{ backgroundColor: '#3A1A1A', color: '#F87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 focus:outline-none focus:border-[#94ECBE] transition-colors"
                style={{ backgroundColor: '#2A1F2E' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 border border-white/10 focus:outline-none focus:border-[#94ECBE] transition-colors"
                style={{ backgroundColor: '#2A1F2E' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 mt-2"
              style={{ backgroundColor: '#94ECBE', color: '#1A141F' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
