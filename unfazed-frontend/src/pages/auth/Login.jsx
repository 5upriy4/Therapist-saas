import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { LogIn, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

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
          <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
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
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
          <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Quick Demo Login (Pre-seeded Accounts)
          </span>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleQuickDemo('dr.sharma@unfazed.in')}
              className="w-full text-left p-2 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs text-slate-700 flex items-center justify-between font-medium transition-colors"
            >
              <span>Dr. Priya Sharma (Growth Plan - SOAP & Packages)</span>
              <span className="text-[10px] font-bold text-teal-600">Fill →</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('dr.verma@unfazed.in')}
              className="w-full text-left p-2 rounded-xl bg-white border border-teal-200 hover:border-teal-400 text-xs text-slate-700 flex items-center justify-between font-medium transition-colors"
            >
              <span>Dr. Rohan Verma (Starter Plan - Tier Gated)</span>
              <span className="text-[10px] font-bold text-teal-600">Fill →</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              loading={loading}
              className="w-full shadow-md"
              icon={LogIn}
            >
              Sign In to Practice Hub
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New to Unfazed?</span>
            <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800">
              Create Therapist Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
