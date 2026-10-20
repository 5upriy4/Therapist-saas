const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      index: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientEmail: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Session start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Session end time is required'],
    },
    duration: {
      type: Number, // in minutes (e.g. 30, 45, 50, 60, 90)
      required: true,
      default: 50,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'confirmed',
      index: true,
    },
    type: {
      type: String,
      enum: ['individual', 'couples', 'consultation'],
      default: 'individual',
    },
    fee: {
      type: Number,
      required: true,
      default: 1500,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    meetingLink: {
      type: String,
      default: 'https://meet.google.com/unfazed-secure-room',
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    clientPackage_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientPackage',
      default: null,
    },
    notes: {
      type: String, // General booking note from client
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help query therapist schedule and detect double bookings
sessionSchema.index({ therapist_id: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Session', sessionSchema);
