const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');

// Default fallback configuration in case DB is not yet seeded
const DEFAULT_FALLBACK_TIERS = {
  starter: {
    tierKey: 'starter',
    name: 'Starter Tier',
    priceINR: 0,
    features: {
      maxActiveClients: 5,
      allowedNoteTemplates: ['freeform'],
      analyticsDepth: 'basic',
      customBranding: false,
      realTimeChat: true,
      packageManagement: false,
      automatedReminders: true,
    },
  },
  growth: {
    tierKey: 'growth',
    name: 'Growth Tier',
    priceINR: 1999,
    features: {
      maxActiveClients: 25,
      allowedNoteTemplates: ['freeform', 'soap'],
      analyticsDepth: 'advanced',
      customBranding: true,
      realTimeChat: true,
      packageManagement: true,
      automatedReminders: true,
    },
  },
  practice: {
    tierKey: 'practice',
    name: 'Practice Tier',
    priceINR: 4999,
    features: {
      maxActiveClients: 999999,
      allowedNoteTemplates: ['freeform', 'soap', 'dap'],
      analyticsDepth: 'advanced',
      customBranding: true,
      realTimeChat: true,
      packageManagement: true,
      automatedReminders: true,
    },
  },
};

/**
 * Retrieves the tier configuration for a therapist
 */
const getTierConfigForTherapist = async (therapistId) => {
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    throw new Error('Therapist not found');
  }

  const tierKey = (therapist.tier || 'starter').toLowerCase();
  let tierConfig = await SubscriptionTierConfig.findOne({ tierKey });

  if (!tierConfig) {
    tierConfig = DEFAULT_FALLBACK_TIERS[tierKey] || DEFAULT_FALLBACK_TIERS.starter;
  }

  return { therapist, tierConfig };
};

/**
 * ONE Centralized Entitlements function:
 * Evaluates whether a therapist can access a feature or perform an action based on their config.
 * Never compares tier strings in application routes.
 *
 * @param {string|ObjectId} therapistId
 * @param {string} featureKey - 'ACTIVE_CLIENTS' | 'NOTE_TEMPLATE' | 'ADVANCED_ANALYTICS' | 'PACKAGES' | 'CUSTOM_BRANDING'
 * @param {object} contextData - Optional context (e.g. { template: 'soap' })
 * @returns {Promise<{ allowed: boolean, reason?: string, currentUsage?: number, limit?: number, tier: string }>}
 */
const canAccess = async (therapistId, featureKey, contextData = {}) => {
  const { therapist, tierConfig } = await getTierConfigForTherapist(therapistId);
  const features = tierConfig.features || {};

  switch (featureKey) {
    case 'ACTIVE_CLIENTS': {
      // Count current active clients
      const activeCount = await Client.countDocuments({
        therapist_id: therapistId,
        status: 'active',
      });

      const maxLimit = features.maxActiveClients ?? 5;
      if (activeCount >= maxLimit) {
        return {
          allowed: false,
          reason: `Active client limit reached (${activeCount}/${maxLimit}). Upgrade your plan to add more clients.`,
          currentUsage: activeCount,
          limit: maxLimit,
          tier: tierConfig.name,
          upgradeRequired: true,
        };
      }

      return {
        allowed: true,
        currentUsage: activeCount,
        limit: maxLimit,
        tier: tierConfig.name,
      };
    }

    case 'NOTE_TEMPLATE': {
      const requestedTemplate = (contextData.template || 'freeform').toLowerCase();
      const allowedTemplates = features.allowedNoteTemplates || ['freeform'];

      if (!allowedTemplates.includes(requestedTemplate)) {
        return {
          allowed: false,
          reason: `The structured '${requestedTemplate.toUpperCase()}' clinical template is not included in the ${tierConfig.name}. Please upgrade to access clinical SOAP/DAP templates.`,
          tier: tierConfig.name,
          requiredFeature: requestedTemplate,
          upgradeRequired: true,
        };
      }

      return {
        allowed: true,
        tier: tierConfig.name,
      };
    }

    case 'ADVANCED_ANALYTICS': {
      const depth = features.analyticsDepth || 'basic';
      if (depth !== 'advanced') {
        return {
          allowed: false,
          reason: `Advanced revenue breakdowns and cohort analytics are available on the Growth & Practice tiers.`,
          tier: tierConfig.name,
          upgradeRequired: true,
        };
      }

      return {
        allowed: true,
        tier: tierConfig.name,
      };
    }

    case 'PACKAGES': {
      if (!features.packageManagement) {
        return {
          allowed: false,
          reason: `Multi-session package creation is available on Growth and Practice plans.`,
          tier: tierConfig.name,
          upgradeRequired: true,
        };
      }

      return {
        allowed: true,
        tier: tierConfig.name,
      };
    }

    case 'CUSTOM_BRANDING': {
      if (!features.customBranding) {
        return {
          allowed: false,
          reason: `Custom domain and advanced profile themes require an upgraded tier.`,
          tier: tierConfig.name,
          upgradeRequired: true,
        };
      }

      return {
        allowed: true,
        tier: tierConfig.name,
      };
    }

    default:
      return { allowed: true, tier: tierConfig.name };
  }
};

/**
 * Returns complete entitlement overview for frontend useEntitlement hook
 */
const getTherapistEntitlements = async (therapistId) => {
  const { therapist, tierConfig } = await getTierConfigForTherapist(therapistId);
  const activeClientsCount = await Client.countDocuments({
    therapist_id: therapistId,
    status: 'active',
  });

  return {
    tierKey: tierConfig.tierKey,
    tierName: tierConfig.name,
    features: tierConfig.features,
    usage: {
      activeClientsCount,
      maxActiveClients: tierConfig.features?.maxActiveClients,
      isNearLimit: activeClientsCount >= (tierConfig.features?.maxActiveClients || 5),
    },
  };
};

module.exports = {
  canAccess,
  getTherapistEntitlements,
  getTierConfigForTherapist,
};
