const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
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
    type: {
      type: String,
      enum: ['private', 'shared'],
      required: true,
      default: 'private',
      index: true,
    },
    template: {
      type: String,
      enum: ['freeform', 'soap', 'dap'],
      default: 'freeform',
    },
    title: {
      type: String,
      default: 'Session Clinical Note',
    },
    content: {
      type: String, // Rich text HTML / TipTap JSON string
      default: '',
    },
    structuredFields: {
      // SOAP Note Fields
      subjective: { type: String, default: '' },
      objective: { type: String, default: '' },
      assessment: { type: String, default: '' },
      plan: { type: String, default: '' },
      // DAP Note Fields
      data: { type: String, default: '' },
      dapAssessment: { type: String, default: '' },
      dapPlan: { type: String, default: '' },
    },
    sharedWithClientAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Crucial: Compound index for efficient isolation queries
sessionNoteSchema.index({ client_id: 1, type: 1 });
sessionNoteSchema.index({ therapist_id: 1, session_id: 1 });

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
