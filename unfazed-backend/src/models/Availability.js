const mongoose = require('mongoose');

const weeklySlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String, // e.g. "09:00" in 24hr HH:mm format
      required: true,
    },
    endTime: {
      type: String, // e.g. "13:00" in 24hr HH:mm format
      required: true,
    },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      required: true,
      min: 0,
      max: 6,
    },
    dayName: {
      type: String,
      required: true,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    slots: [weeklySlotSchema],
  },
  { _id: false }
);

const oneTimeOverrideSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    slots: [weeklySlotSchema],
    reason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const waitlistEntrySchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String },
    preferredDate: { type: String }, // YYYY-MM-DD
    preferredTimeRange: { type: String }, // 'morning', 'afternoon', 'evening'
    notified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const availabilitySchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      unique: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    bufferTime: {
      type: Number, // in minutes between consecutive sessions
      default: 15,
    },
    slotDurations: {
      type: [Number], // e.g. [30, 45, 60, 90]
      default: [30, 45, 50, 60, 90],
    },
    defaultDuration: {
      type: Number,
      default: 50,
    },
    weeklySchedule: [dayScheduleSchema],
    oneTimeOverrides: [oneTimeOverrideSchema],
    blockedDates: [String], // Array of 'YYYY-MM-DD' dates blocked entirely (holidays, personal leave)
    waitlist: [waitlistEntrySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Availability', availabilitySchema);
