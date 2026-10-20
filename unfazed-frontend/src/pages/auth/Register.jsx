import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { UserPlus, AlertCircle, Sparkles } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: 'Consultant Clinical Psychologist',
    bio: 'Dedicated to offering affirmative, evidence-based psychotherapy.',
    specializations: 'Anxiety, CBT, Stress Management',
    sessionFee: 1500,
    phone: '+91 98765 43210',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerTherapist } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const specArray = formData.specializations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await registerTherapist({
        ...formData,
        sessionFee: Number(formData.sessionFee) || 1500,
        specializations: specArray,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check form entries.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
            U
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Launch Your Private Practice
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Create your branded booking link (e.g. unfazed.in/your-name), availability schedule, and practice dashboard.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (with Dr. prefix if applicable) *
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="priya@example.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Fee (INR) *
                </label>
                <input
                  type="number"
                  required
                  name="sessionFee"
                  value={formData.sessionFee}
                  onChange={handleChange}
                  placeholder="1500"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Title / Licensure
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Consultant Clinical Psychologist (RCI Reg.)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specializations (Comma-separated)
              </label>
              <input
                type="text"
                name="specializations"
                value={formData.specializations}
                onChange={handleChange}
                placeholder="Anxiety, CBT, EMDR, Trauma Recovery"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                About Practice / Bio
              </label>
              <textarea
                rows={2}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="A brief overview of your therapeutic container and philosophy..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              loading={loading}
              className="w-full shadow-md"
              icon={UserPlus}
            >
              Complete Setup & Open Practice
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Already registered?</span>
            <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800">
              Sign In to Existing Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
