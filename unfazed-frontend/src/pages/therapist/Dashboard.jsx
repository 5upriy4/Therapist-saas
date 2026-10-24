import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useEntitlement from '../../hooks/useEntitlement';
import api from '../../api/axiosInstance';
import StatCard from '../../components/analytics/StatCard';
import RevenueChart from '../../components/analytics/RevenueChart';
import SessionStatusChart from '../../components/analytics/SessionStatusChart';
import Loader from '../../components/common/Loader';
import UpgradePromptModal from '../../components/common/UpgradePromptModal';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const {
    tierName,
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-blue-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>{tierName} Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user?.name}
            </h1>
            <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
              Your Unfazed practice management engine is live. Share your branded link with clients to schedule sessions, capture clinical consent, and collect advance fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to={`/${user?.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-800 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all"
            >
              <span>View Branded Profile</span>
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </Link>

            <button
              onClick={() => openUpgradeModal('DASHBOARD_UPGRADE')}
              className="inline-flex items-center justify-center gap-2 bg-blue-600/70 hover:bg-blue-600 text-white border border-blue-400/30 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
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
          color="blue"
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
          color="sky"
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
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Upcoming Appointments</span>
            </h3>
            <Link to="/schedule" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Manage Schedule →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((sess) => (
                <div key={sess._id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{sess.clientName}</p>
                    <p className="text-slate-500 mt-0.5">
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
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {sess.status}
                    </span>
                    {sess.meetingLink && (
                      <a
                        href={sess.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        title="Join Meeting"
                      >
                        <Video className="w-4 h-4 text-blue-600" />
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
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Recent Invoices & Transactions</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">GST-compliant</span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayments.length > 0 ? (
              recentPayments.map((pmt) => (
                <div key={pmt._id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">₹{pmt.amount}</span>
                      <span className="text-slate-500 font-mono text-[11px]">#{pmt.invoiceNumber || 'INV-Pending'}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {pmt.clientName || 'Direct Booking'} • {new Date(pmt.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
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
