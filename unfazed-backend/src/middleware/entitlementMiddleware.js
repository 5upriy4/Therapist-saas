const { canAccess } = require('../services/entitlementService');

/**
 * Middleware factory to guard routes using the central Entitlement Service
 * @param {string} featureKey - 'ACTIVE_CLIENTS' | 'NOTE_TEMPLATE' | 'ADVANCED_ANALYTICS' | 'PACKAGES'
 * @param {function} [contextExtractor] - Optional callback (req) => contextData
 */
const requireEntitlement = (featureKey, contextExtractor = null) => {
  return async (req, res, next) => {
    try {
      const therapistId = req.therapist?._id || req.body?.therapist_id || req.query?.therapist_id;

      if (!therapistId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Therapist identifier required for entitlement check.',
        });
      }

      const contextData = contextExtractor ? contextExtractor(req) : req.body;
      const check = await canAccess(therapistId, featureKey, contextData);

      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          error: check.reason || 'Upgrade required to access this feature',
          upgradeRequired: true,
          featureKey,
          tier: check.tier,
          currentUsage: check.currentUsage,
          limit: check.limit,
        });
      }

      // Attach check result to request for controller visibility if needed
      req.entitlement = check;
      next();
    } catch (error) {
      console.error('[Entitlement Middleware Error]', error);
      next(error);
    }
  };
};

module.exports = {
  requireEntitlement,
};
