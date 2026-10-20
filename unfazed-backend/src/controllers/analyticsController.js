const mongoose = require('mongoose');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const { canAccess } = require('../services/entitlementService');

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Comprehensive Practice Analytics using MongoDB Aggregation Framework
 *          Respects tier gating for advanced analytics depth
 * @access  Private (Therapist)
 */
const getPracticeAnalytics = async (req, res, next) => {
  try {
    const therapistId = new mongoose.Types.ObjectId(req.therapist._id);

    // Check entitlement for advanced analytics depth
    const entitlementCheck = await canAccess(req.therapist._id, 'ADVANCED_ANALYTICS');
    const isAdvancedAllowed = entitlementCheck.allowed;

    // 1. Pipeline: Revenue Trend (Monthly Aggregation)
    const revenueTrendPipeline = [
      {
        $match: {
          therapist_id: therapistId,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$paidAt' },
          },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgTicketSize: { $avg: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          revenue: '$totalRevenue',
          transactions: '$transactionCount',
          avgTicket: { $round: ['$avgTicketSize', 0] },
          _id: 0,
        },
      },
    ];

    // 2. Pipeline: Session Status Breakdown & No-Show Rate Aggregation
    const sessionStatusPipeline = [
      {
        $match: {
          therapist_id: therapistId,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    // 3. Pipeline: Busiest Days of Week (Aggregation)
    const dayOfWeekPipeline = [
      {
        $match: {
          therapist_id: therapistId,
        },
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$startTime' }, // 1 (Sun) - 7 (Sat)
        },
      },
      {
        $group: {
          _id: '$dayOfWeek',
          sessionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    // Execute aggregation pipelines concurrently
    const [revenueData, statusData, dayOfWeekData, activeClientsCount, totalClientsCount] = await Promise.all([
      Payment.aggregate(revenueTrendPipeline),
      Session.aggregate(sessionStatusPipeline),
      Payment.aggregate(dayOfWeekPipeline), // Or Session
      Client.countDocuments({ therapist_id: req.therapist._id, status: 'active' }),
      Client.countDocuments({ therapist_id: req.therapist._id }),
    ]);

    // Calculate No-Show Rate and Summary from aggregation result
    let totalSessions = 0;
    let noShowCount = 0;
    let completedCount = 0;
    let confirmedCount = 0;
    let cancelledCount = 0;

    statusData.forEach((item) => {
      totalSessions += item.count;
      if (item._id === 'no-show') noShowCount = item.count;
      if (item._id === 'completed') completedCount = item.count;
      if (item._id === 'confirmed') confirmedCount = item.count;
      if (item._id === 'cancelled') cancelledCount = item.count;
    });

    const noShowRate = totalSessions > 0 ? Math.round((noShowCount / totalSessions) * 100) : 0;
    const totalLifetimeRevenue = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);

    // Map day of week data
    const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayDistribution = [2, 3, 4, 5, 6].map((dayNum) => {
      const found = dayOfWeekData.find((d) => d._id === dayNum);
      return {
        day: dayNames[dayNum],
        sessions: found ? found.sessionCount : 0,
      };
    });

    // Format session breakdown for donut / pie charts
    const sessionBreakdown = [
      { name: 'Completed', value: completedCount, color: '#10b981' },
      { name: 'Confirmed', value: confirmedCount, color: '#3b82f6' },
      { name: 'No-Show', value: noShowCount, color: '#ef4444' },
      { name: 'Cancelled', value: cancelledCount, color: '#94a3b8' },
    ];

    return res.json({
      success: true,
      tier: req.therapist.tier,
      isAdvancedAllowed,
      metrics: {
        totalRevenue: totalLifetimeRevenue,
        activeClients: activeClientsCount,
        totalClients: totalClientsCount,
        totalSessions,
        noShowRate: `${noShowRate}%`,
        completionRate: totalSessions > 0 ? `${Math.round((completedCount / totalSessions) * 100)}%` : '0%',
      },
      charts: {
        revenueTrend: revenueData.length > 0 ? revenueData : [{ month: 'Current', revenue: totalLifetimeRevenue, transactions: 1 }],
        sessionBreakdown,
        // Detailed graphs only if entitled or provide basic preview
        weekdayDistribution: isAdvancedAllowed ? weekdayDistribution : [],
      },
      upgradePrompt: !isAdvancedAllowed
        ? {
            required: true,
            message: 'Upgrade to Growth or Practice tier to unlock multi-month cohort retention and weekday load analytics.',
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPracticeAnalytics,
};
