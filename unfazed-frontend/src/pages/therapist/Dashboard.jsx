import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useEntitlement from '../../hooks/useEntitlement';
import api from '../../api/axiosInstance';
import StatCard from '../../components/analytics/StatCard';
import RevenueChart from '../../components/analytics/RevenueChart';
import SessionStatusChart from '../../components/analytics/SessionStatusChart';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import UpgradePromptModal from '../../components/common/UpgradePromptModal';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Video,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const {
    tierName,
    tierKey,
    activeClientsCount,
    maxActiveClients,
    upgradeModalState,
    openUpgradeModal,
    closeUpgradeModal,
    upgradeTier,
  } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, sessionsRes, paymentsRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/scheduling/sessions?timeframe=upcoming'),
          api.get('/payments/therapist-payments'),
        ]);

        if (analyticsRes.data?.success) setAnalytics(analyticsRes.data);
        if (sessionsRes.data?.success) setUpcomingSessions(sessionsRes.data.sessions?.slice(0, 5) || []);
        if (paymentsRes.data?.success) setRecentPayments(paymentsRes.data.payments?.slice(0, 5) || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader text="Loading your private practice dashboard..." />;
  }

  const metrics = analytics?.metrics || {
    totalRevenue: 0,
    activeClients: activeClientsCount,
    totalSessions: 0,
    noShowRate: '0%',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Practice Link Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-teal-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tierName} Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user?.name}
            </h1>
            <p className="text-sm text-teal-100 max-w-xl">
              Your Unfazed practice management engine is live. Share your branded link with clients to schedule sessions, capture clinical consent, and collect advance fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to={`/${user?.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 bg-white text-teal-800 hover:bg-teal-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all"
            >
              <span>View Branded Profile</span>
              <ExternalLink className="w-4 h-4" />
            </Link>

            <button
              onClick={() => openUpgradeModal('DASHBOARD_UPGRADE')}
              className="inline-flex items-center justify-center gap-2 bg-teal-600/60 hover:bg-teal-600 text-white border border-teal-400/30 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all"
            >
              <span>Change Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Practice KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Revenue"
          value={`₹${metrics.totalRevenue?.toLocaleString('en-IN')}`}
          subtitle="Collected via Razorpay"
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Active Clients"
          value={`${activeClientsCount} / ${maxActiveClients === 999999 ? '∞' : maxActiveClients}`}
          subtitle="Enforced by Entitlement Tier"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Sessions"
          value={metrics.totalSessions}
          subtitle={`${metrics.completionRate} completed`}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="No-Show Rate"
          value={metrics.noShowRate}
          subtitle="Computed via Aggregation"
          icon={Clock}
          color="rose"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={analytics?.charts?.revenueTrend || []} />
        </div>
        <div>
          <SessionStatusChart data={analytics?.charts?.sessionBreakdown || []} />
        </div>
      </div>

      {/* Upcoming Sessions & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Upcoming Appointments</span>
            </h3>
            <Link to="/schedule" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              Manage Schedule →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((sess) => (
                <div key={sess._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{sess.clientName}</p>
                    <p className="text-slate-500">
                      {new Date(sess.startTime).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      at{' '}
                      {new Date(sess.startTime).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {' '}({sess.duration}m)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700">
                      {sess.status}
                    </span>
                    {sess.meetingLink && (
                      <a
                        href={sess.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                        title="Join Meeting"
                      >
                        <Video className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming sessions scheduled.</p>
            )}
          </div>
        </div>

        {/* Recent Billing & Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Recent Invoices & Transactions</span>
            </h3>
            <span className="text-xs text-slate-400">GST-compliant</span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayments.length > 0 ? (
              recentPayments.map((pmt) => (
                <div key={pmt._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">₹{pmt.amount}</span>
                      <span className="text-slate-500 text-[11px]">#{pmt.invoiceNumber || 'INV-Pending'}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {pmt.clientName || 'Direct Booking'} • {new Date(pmt.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-teal-50 text-teal-700">
                    {pmt.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No transactions recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={upgradeModalState.isOpen}
        onClose={closeUpgradeModal}
        featureKey={upgradeModalState.featureKey}
        reason={upgradeModalState.reason}
        onUpgradeSuccess={upgradeTier}
      />
    </div>
  );
};

export default Dashboard;
