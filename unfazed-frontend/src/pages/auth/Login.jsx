import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { LogIn, Sparkles, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTherapist } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginTherapist(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md shadow-blue-500/25">
            U
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Therapist Practice Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to manage appointments, clinical SOAP notes, and practice analytics.
          </p>
        </div>

        {/* Quick Demo Credentials Switcher for Evaluators / Reviewers */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Quick Demo Login (Pre-seeded Accounts)
          </span>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleQuickDemo('dr.sharma@unfazed.in')}
              className="w-full text-left p-2.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-xs text-slate-700 flex items-center justify-between font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <span>Dr. Priya Sharma (Growth Plan - SOAP & Packages)</span>
              <span className="text-[10px] font-bold text-blue-600">Fill →</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('dr.verma@unfazed.in')}
              className="w-full text-left p-2.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-xs text-slate-700 flex items-center justify-between font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <span>Dr. Rohan Verma (Starter Plan - Tier Gated)</span>
              <span className="text-[10px] font-bold text-blue-600">Fill →</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <p className="text-[11px] text-rose-600 pl-6">
                If you haven't registered this email yet, click{' '}
                <Link to="/register" className="underline font-bold text-rose-700">
                  Create Therapist Account
                </Link>{' '}
                below, or click one of the pre-seeded demo accounts above.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.sharma@unfazed.in"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              loading={loading}
              className="w-full shadow-md shadow-blue-500/25"
              icon={LogIn}
            >
              Sign In to Practice Hub
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New to Unfazed?</span>
            <Link to="/register" className="font-bold text-blue-700 hover:text-blue-800 transition-colors">
              Create Therapist Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
