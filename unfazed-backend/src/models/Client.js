const mongoose = require('mongoose');

const intakeFormSchema = new mongoose.Schema(
  {
    demographics: {
      age: { type: Number },
      gender: { type: String, enum: ['female', 'male', 'non-binary', 'prefer-not-to-say', 'other'] },
      occupation: { type: String },
      emergencyContactName: { type: String },
      emergencyContactPhone: { type: String },
      emergencyContactRelationship: { type: String },
    },
    presentingConcern: {
      type: String, // Reason for seeking therapy
    },
    medicalHistory: {
      type: String, // Any ongoing medical conditions or medications
    },
    mentalHealthHistory: {
      type: String, // Previous therapy experience or diagnoses
    },
    goals: {
      type: String, // What they hope to achieve
    },
    preferredLanguage: {
      type: String,
      default: 'English',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const consentSchema = new mongoose.Schema(
  {
    agreed: {
      type: Boolean,
      required: true,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'Mozilla/5.0 WebClient',
    },
    consentVersion: {
      type: String,
      default: 'v1.0-standard-telehealth-consent',
    },
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: [true, 'Client must belong to a therapist'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide client name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide client email'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['lead', 'active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    tags: {
      type: [String],
      default: ['individual'],
    },
    intakeForm: {
      type: intakeFormSchema,
      default: null,
    },
    consent: {
      type: consentSchema,
      default: null,
    },
    lastSessionDate: {
      type: Date,
      default: null,
    },
    totalSessionsCount: {
      type: Number,
      default: 0,
    },
    internalNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure clean lookups per therapist
clientSchema.index({ therapist_id: 1, email: 1 });
clientSchema.index({ therapist_id: 1, status: 1 });

module.exports = mongoose.model('Client', clientSchema);
