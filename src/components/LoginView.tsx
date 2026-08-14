'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, Mail, ArrowRight, Lock, CheckCircle2, AlertCircle, Key, UserCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const [loginMode, setLoginMode] = useState<'advisor' | 'admin'>('advisor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed');
    }
  };

  const handleAdminQuickLogin = async () => {
    setEmail('Admin@fortuneinvestment.in');
    setPassword('Evolve@26');
    setErrorMsg('');
    setLoading(true);
    const res = await login('Admin@fortuneinvestment.in', 'Evolve@26');
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Admin Login failed');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    const res = await resetPassword(resetEmail);
    if (res.success) {
      setResetSuccessMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetic blobs */}
      <div className="absolute top-1/4 left-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-slate-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/30 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Fortune Suite Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Fortune Investment Services Pvt Ltd • IRDAI Advisor Suite</p>
        </div>

        {/* Mode Selector Tabs: Advisor Login vs Admin Login */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginMode('advisor');
              if (email === 'Admin@fortuneinvestment.in') setEmail('');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'advisor'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Advisor Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setEmail('Admin@fortuneinvestment.in');
              setPassword('Evolve@26');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'admin'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {loginMode === 'admin' ? 'Admin ID / Email' : 'Advisor Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginMode === 'admin' ? 'Admin@fortuneinvestment.in' : 'advisor@fortune.com'}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                required
              />
            </div>
            {loginMode === 'admin' && (
              <p className="text-[11px] text-purple-400 mt-1">
                Admin ID: <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-purple-300">Admin@fortuneinvestment.in</code>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              {loginMode === 'advisor' && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || 'fortune.rahul@fortune.com');
                    setResetModalOpen(true);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={loginMode === 'admin' ? 'Evolve@26' : '••••••••••••'}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              />
            </div>
            {loginMode === 'admin' && (
              <p className="text-[11px] text-purple-400 mt-1">
                Admin Password: <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-purple-300">Evolve@26</code>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
              loginMode === 'admin'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
            }`}
          >
            {loading ? 'Authenticating...' : loginMode === 'admin' ? 'Sign In as Admin' : 'Sign In to Advisor Suite'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Admin Login Button Card */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleAdminQuickLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>⚡ 1-Click Login as Admin (Admin@fortuneinvestment.in)</span>
          </button>
        </div>

        {/* Password Reset Modal */}
        {resetModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm">
              <h3 className="text-base font-bold text-white mb-2">Reset Password</h3>
              <p className="text-xs text-slate-400 mb-4">
                Enter your registered email address to receive a secure recovery link.
              </p>

              {resetSuccessMsg ? (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-medium mb-4 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{resetSuccessMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    placeholder="email@fortune.com"
                    required
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalOpen(false);
                        setResetSuccessMsg('');
                      }}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              )}

              {resetSuccessMsg && (
                <div className="text-right">
                  <button
                    onClick={() => {
                      setResetModalOpen(false);
                      setResetSuccessMsg('');
                    }}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
