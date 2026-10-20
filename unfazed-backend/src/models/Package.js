const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g. "Anxiety & Stress Relief (3 Sessions)", "Deep Healing (6 Sessions)", "Complete Transformation (12 Sessions)"
    },
    sessionCount: {
      type: Number,
      required: true,
      enum: [3, 6, 12, 24],
      default: 3,
    },
    price: {
      type: Number,
      required: true,
    },
    perSessionRate: {
      type: Number,
      required: true,
    },
    validityDays: {
      type: Number,
      default: 90, // e.g. 90 days validity
    },
    description: {
      type: String,
      default: '',
    },
    savingsPercentage: {
      type: Number,
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Package', packageSchema);
