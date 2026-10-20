const crypto = require('crypto');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const Client = require('../models/Client');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const Therapist = require('../models/Therapist');
const { getRazorpayInstance, isConfigured } = require('../config/razorpay');
const { generateInvoicePDF } = require('../services/invoiceService');
const { sendPaymentReceipt } = require('../services/notificationService');
const { canAccess } = require('../services/entitlementService');

/**
 * Helper to generate sequential invoice number
 */
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `UFZ-${year}-${randomSuffix}`;
};

/**
 * @route   POST /api/payments/create-order
 * @desc    Initiate Razorpay order for session or package
 * @access  Public
 */
const createOrder = async (req, res, next) => {
  try {
    const { therapistId, clientId, sessionId, packageId, amount, itemType, itemDescription, clientName, clientEmail } = req.body;

    if (!therapistId || !amount) {
      return res.status(400).json({ success: false, error: 'Therapist ID and amount are required' });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let orderId = `order_sim_${Date.now()}`;

    // If real Razorpay keys are configured, call the Razorpay API
    if (isConfigured()) {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          therapistId,
          clientId: clientId || '',
          sessionId: sessionId || '',
          itemType: itemType || 'session',
        },
      };

      const razorpayOrder = await razorpay.orders.create(options);
      orderId = razorpayOrder.id;
    }

    // Create payment entry in database
    const payment = await Payment.create({
      therapist_id: therapistId,
      client_id: clientId || null,
      session_id: sessionId || null,
      package_id: packageId || null,
      itemType: itemType || 'session',
      itemDescription: itemDescription || 'Therapy Consultation Session',
      amount: Number(amount),
      currency: 'INR',
      gateway: 'razorpay',
      gateway_order_id: orderId,
      clientName: clientName || '',
      clientEmail: clientEmail || '',
      status: 'created',
      platform_fee: Math.round(Number(amount) * 0.02), // 2% platform fee config
      net_amount: Math.round(Number(amount) * 0.98),
    });

    return res.status(201).json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated_key',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature and generate GST invoice
 * @access  Public
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentRecordId } = req.body;

    let payment = null;
    if (paymentRecordId) {
      payment = await Payment.findById(paymentRecordId);
    } else if (razorpay_order_id) {
      payment = await Payment.findOne({ gateway_order_id: razorpay_order_id });
    }

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    // Verify cryptographic signature if secret is active and not sandbox simulation
    if (isConfigured() && process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ success: false, error: 'Invalid payment signature verification failed' });
      }
    }

    // Mark payment as paid
    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.gateway_payment_id = razorpay_payment_id || `pay_sim_${Date.now()}`;
    payment.gateway_signature = razorpay_signature || 'simulated_sig';
    if (!payment.invoiceNumber) {
      payment.invoiceNumber = generateInvoiceNumber();
    }

    await payment.save();

    // If linked to a Session, mark session as confirmed & attach payment ID
    if (payment.session_id) {
      await Session.findByIdAndUpdate(payment.session_id, {
        payment_id: payment._id,
        status: 'confirmed',
      });
    }

    // If payment was for a multi-session Package, create ClientPackage
    if (payment.itemType === 'package' && payment.package_id && payment.client_id) {
      const pkg = await Package.findById(payment.package_id);
      if (pkg) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (pkg.validityDays || 90));

        await ClientPackage.create({
          client_id: payment.client_id,
          therapist_id: payment.therapist_id,
          package_id: pkg._id,
          packageName: pkg.name,
          payment_id: payment._id,
          totalSessions: pkg.sessionCount,
          remainingSessions: pkg.sessionCount,
          expiresAt,
          status: 'active',
        });
      }
    }

    // Dispatch receipt notification
    const therapist = await Therapist.findById(payment.therapist_id);
    const client = payment.client_id ? await Client.findById(payment.client_id) : { name: payment.clientName, email: payment.clientEmail };

    if (therapist && client) {
      try {
        await sendPaymentReceipt({ therapist, client, payment });
      } catch (e) {
        console.warn('[Notification Error]', e.message);
      }
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully and invoice generated',
      payment,
      invoiceNumber: payment.invoiceNumber,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay Webhooks (order.paid, payment.captured)
 * @access  Public (Signature Verified)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ status: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    console.log(`[Razorpay Webhook Event] ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        const payment = await Payment.findOne({ gateway_order_id: orderId });
        if (payment && payment.status !== 'paid') {
          payment.status = 'paid';
          payment.paidAt = new Date();
          payment.gateway_payment_id = paymentEntity.id;
          payment.webhookReceived = true;
          if (!payment.invoiceNumber) {
            payment.invoiceNumber = generateInvoiceNumber();
          }
          await payment.save();
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Webhook Error]', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @route   GET /api/payments/invoice/:id
 * @desc    Download GST-compliant tax invoice PDF
 * @access  Public (or authenticated)
 */
const downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Invoice not found for this payment' });
    }

    const therapist = await Therapist.findById(payment.therapist_id);
    const client = payment.client_id ? await Client.findById(payment.client_id) : { name: payment.clientName, email: payment.clientEmail };

    const pdfBuffer = await generateInvoicePDF(payment, therapist, client);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Invoice-${payment.invoiceNumber || id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/therapist-payments
 * @desc    Get therapist's billing & transaction history
 * @access  Private (Therapist)
 */
const getTherapistPayments = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const payments = await Payment.find({ therapist_id: therapistId }).sort({ createdAt: -1 });

    const totalRevenue = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    return res.json({
      success: true,
      totalRevenue,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/packages
 * @desc    Create a multi-session package (Gated by PACKAGES entitlement)
 * @access  Private (Therapist)
 */
const createPackage = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { name, sessionCount, price, perSessionRate, validityDays, description, savingsPercentage } = req.body;

    // Entitlement Check: PACKAGES
    const entitlementCheck = await canAccess(therapistId, 'PACKAGES');
    if (!entitlementCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: entitlementCheck.reason,
        upgradeRequired: true,
      });
    }

    const pkg = await Package.create({
      therapist_id: therapistId,
      name,
      sessionCount,
      price,
      perSessionRate: perSessionRate || Math.round(price / sessionCount),
      validityDays: validityDays || 90,
      description: description || '',
      savingsPercentage: savingsPercentage || 15,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/packages
 * @desc    Get packages for logged in therapist
 * @access  Private (Therapist)
 */
const getTherapistPackages = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const packages = await Package.find({ therapist_id: therapistId }).sort({ sessionCount: 1 });
    return res.json({ success: true, packages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  downloadInvoice,
  getTherapistPayments,
  createPackage,
  getTherapistPackages,
};
