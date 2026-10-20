const mongoose = require('mongoose');

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tierKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // e.g. 'starter', 'growth', 'practice'
    },
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g. 'Starter Tier', 'Growth Tier', 'Practice / Scale'
    },
    tagline: {
      type: String,
      default: '',
    },
    priceINR: {
      type: Number,
      required: true,
      default: 0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Config-driven limits and feature gating caps
    features: {
      maxActiveClients: {
        type: Number,
        default: 5, // e.g. starter: 5, growth: 25, practice: 999999
      },
      allowedNoteTemplates: {
        type: [String],
        default: ['freeform'], // e.g. ['freeform', 'soap', 'dap']
      },
      analyticsDepth: {
        type: String,
        enum: ['basic', 'advanced'],
        default: 'basic',
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      realTimeChat: {
        type: Boolean,
        default: true,
      },
      packageManagement: {
        type: Boolean,
        default: false,
      },
      automatedReminders: {
        type: Boolean,
        default: true,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SubscriptionTierConfig', subscriptionTierConfigSchema);
