import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import useEntitlement from '../../hooks/useEntitlement';
import StatCard from '../../components/analytics/StatCard';
import RevenueChart from '../../components/analytics/RevenueChart';
import SessionStatusChart from '../../components/analytics/SessionStatusChart';
import UpgradePromptModal from '../../components/common/UpgradePromptModal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const Analytics = () => {
  const { hasAdvancedAnalytics, openUpgradeModal, upgradeModalState, closeUpgradeModal, upgradeTier } =
    useEntitlement();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/dashboard');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load practice analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <Loader text="Executing MongoDB practice aggregation pipelines..." />;
  }

  const metrics = data?.metrics || {
    totalRevenue: 0,
    activeClients: 0,
    totalSessions: 0,
    noShowRate: '0%',
    completionRate: '0%',
  };

  const isAdvanced = data?.isAdvancedAllowed;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            <span>Practice Performance Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time business insights aggregated directly in MongoDB pipelines without client-side computation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {isAdvanced ? 'Advanced Analytics Enabled' : 'Basic Analytics (Starter)'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Practice Revenue"
          value={`₹${metrics.totalRevenue?.toLocaleString('en-IN')}`}
          subtitle="Net collected through gateway"
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Active Caseload"
          value={metrics.activeClients}
          subtitle={`Across ${metrics.totalClients || metrics.activeClients} total clients`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="No-Show Rate"
          value={metrics.noShowRate}
          subtitle="Direct database percentage"
          icon={Clock}
          color="rose"
        />
        <StatCard
          title="Completion Rate"
          value={metrics.completionRate}
          subtitle={`${metrics.totalSessions} total scheduled appointments`}
          icon={Calendar}
          color="emerald"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={data?.charts?.revenueTrend || []} />
        </div>
        <div>
          <SessionStatusChart data={data?.charts?.sessionBreakdown || []} />
        </div>
      </div>

      {/* Advanced Gated Feature: Weekday Appointment Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span>Weekday Appointment Volume & Peak Hours</span>
            </h4>
            <p className="text-xs text-slate-500">
              Aggregated distribution by day-of-week for optimal schedule planning
            </p>
          </div>

          {!isAdvanced && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Gated Feature (Growth/Practice Tier)
            </span>
          )}
        </div>

        {isAdvanced ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts?.weekdayDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="sessions" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Gated Blur Overlay */
          <div className="relative py-12 flex flex-col items-center justify-center text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-full">
              <Sparkles className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-slate-900 text-sm">
              Advanced Practice Analytics is Locked
            </h5>
            <p className="text-xs text-slate-500 max-w-md">
              Upgrade to the Growth or Practice tier to unlock weekly volume trends, repeat retention rates, and multi-month cohort retention charts.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              onClick={() => openUpgradeModal('ADVANCED_ANALYTICS')}
            >
              Upgrade to Unlock
            </Button>
          </div>
        )}
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

export default Analytics;
