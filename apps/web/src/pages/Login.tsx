import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore(state => state.setAuth);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      setAuth(token, user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-xl shadow-indigo-500/10">
            <Trophy className="w-10 h-10 text-indigo-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-bold">Season 4 Admin Portal</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-800/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="email"
                  required
                  className="w-full bg-gray-800/40 border border-gray-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
                  placeholder="admin@fantasydraft.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="password"
                  required
                  className="w-full bg-gray-800/40 border border-gray-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 transition-all active:scale-[0.98] group"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Enter Draft Room
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 mt-8 text-xs">
          Forgot your credentials? Contact the League Commissioner.
        </p>
      </div>
    </div>
  );
}
