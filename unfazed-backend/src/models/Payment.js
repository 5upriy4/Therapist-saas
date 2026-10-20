const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
      index: true,
    },
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    },
    itemType: {
      type: String,
      enum: ['session', 'package'],
      default: 'session',
    },
    itemDescription: {
      type: String,
      default: 'Psychological Consultation & Therapy Session',
    },
    amount: {
      type: Number,
      required: true, // Total gross amount in INR (e.g. 1500)
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gateway: {
      type: String,
      default: 'razorpay',
    },
    gateway_order_id: {
      type: String,
      default: '',
    },
    gateway_payment_id: {
      type: String,
      default: '',
      index: true,
    },
    gateway_signature: {
      type: String,
      default: '',
    },
    platform_fee: {
      type: Number,
      default: 0, // e.g. 2% or flat fee
    },
    gst_amount: {
      type: Number,
      default: 0, // 18% GST (9% CGST + 9% SGST)
    },
    net_amount: {
      type: Number,
      default: function () {
        return this.amount - this.platform_fee;
      },
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    clientName: {
      type: String,
      default: '',
    },
    clientEmail: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    webhookReceived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ therapist_id: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
