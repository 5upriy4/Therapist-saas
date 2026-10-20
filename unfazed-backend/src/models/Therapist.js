const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide therapist name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password_hash: {
      type: String,
      required: [true, 'Please provide password'],
      select: false, // Don't return password hash by default
    },
    slug: {
      type: String,
      required: [true, 'Please provide a unique profile slug'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      default: 'Licensed Clinical Psychologist',
    },
    bio: {
      type: String,
      default: '',
    },
    specializations: {
      type: [String],
      default: ['Anxiety & Depression', 'Cognitive Behavioral Therapy (CBT)', 'Stress Management'],
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    experienceYears: {
      type: Number,
      default: 5,
    },
    education: {
      type: String,
      default: 'M.Phil in Clinical Psychology, RCI Licensed',
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1594824813511-13c54c340795?auto=format&fit=crop&w=600&q=80',
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80',
    },
    sessionFee: {
      type: Number,
      default: 1500, // in INR
    },
    sessionDuration: {
      type: Number,
      default: 50, // in minutes
    },
    currency: {
      type: String,
      default: 'INR',
    },
    tier: {
      type: String,
      default: 'starter', // Key mapped to SubscriptionTierConfig
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    address: {
      clinicName: { type: String, default: 'Serene Mind Wellness Clinic' },
      street: { type: String, default: '12th Main, Indiranagar' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      pincode: { type: String, default: '560038' },
      gstin: { type: String, default: '29ABCDE1234F1Z5' },
    },
    socialLinks: {
      website: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
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

// Indexes
therapistSchema.index({ slug: 1 });
therapistSchema.index({ email: 1 });

module.exports = mongoose.model('Therapist', therapistSchema);
