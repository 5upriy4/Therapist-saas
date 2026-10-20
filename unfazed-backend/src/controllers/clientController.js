const Client = require('../models/Client');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const SessionNote = require('../models/SessionNote');
const { canAccess } = require('../services/entitlementService');

/**
 * @route   GET /api/clients
 * @desc    Get therapist's client list (with search, filter by status/tag, and sorting)
 * @access  Private (Therapist)
 */
const getClients = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { search, status, tag, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = { therapist_id: therapistId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const clients = await Client.find(query).sort(sortOptions);

    return res.json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/clients/:id
 * @desc    Get individual client profile aggregating session history + payment history + notes
 * @access  Private (Therapist)
 */
const getClientById = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const clientId = req.params.id;

    const client = await Client.findOne({ _id: clientId, therapist_id: therapistId });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client record not found' });
    }

    // Aggregate sessions for this client
    const sessions = await Session.find({ client_id: clientId, therapist_id: therapistId }).sort({ startTime: -1 });

    // Aggregate payments for this client
    const payments = await Payment.find({ client_id: clientId, therapist_id: therapistId }).sort({ createdAt: -1 });

    // Therapist can view ALL notes (both private and shared)
    const notes = await SessionNote.find({ client_id: clientId, therapist_id: therapistId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      client,
      sessions,
      payments,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/clients
 * @desc    Manually add a new client (Gated by ACTIVE_CLIENTS entitlement)
 * @access  Private (Therapist)
 */
const createClient = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { name, email, phone, tags, internalNotes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Please provide client name and email' });
    }

    // Centralized Entitlement Check: ACTIVE_CLIENTS
    const entitlementCheck = await canAccess(therapistId, 'ACTIVE_CLIENTS');
    if (!entitlementCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: entitlementCheck.reason,
        upgradeRequired: true,
        currentUsage: entitlementCheck.currentUsage,
        limit: entitlementCheck.limit,
      });
    }

    const client = await Client.create({
      therapist_id: therapistId,
      name,
      email: email.toLowerCase(),
      phone,
      tags: tags || ['individual'],
      status: 'active',
      internalNotes: internalNotes || '',
    });

    return res.status(201).json({
      success: true,
      client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client status, tags, or notes
 * @access  Private (Therapist)
 */
const updateClient = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const clientId = req.params.id;
    const { name, email, phone, status, tags, internalNotes } = req.body;

    const client = await Client.findOne({ _id: clientId, therapist_id: therapistId });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // If changing status to active, verify entitlement limit
    if (status === 'active' && client.status !== 'active') {
      const entitlementCheck = await canAccess(therapistId, 'ACTIVE_CLIENTS');
      if (!entitlementCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: entitlementCheck.reason,
          upgradeRequired: true,
          limit: entitlementCheck.limit,
        });
      }
    }

    if (name) client.name = name;
    if (email) client.email = email.toLowerCase();
    if (phone !== undefined) client.phone = phone;
    if (status) client.status = status;
    if (tags) client.tags = tags;
    if (internalNotes !== undefined) client.internalNotes = internalNotes;

    await client.save();

    return res.json({
      success: true,
      client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/clients/intake-and-consent
 * @desc    Save client intake form data and digital consent timestamp
 * @access  Public (Client submission before session)
 */
const submitIntakeAndConsent = async (req, res, next) => {
  try {
    const { clientId, demographics, presentingConcern, medicalHistory, mentalHealthHistory, goals, consentAgreed } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'Client ID is required' });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Save intake details
    client.intakeForm = {
      demographics: demographics || {},
      presentingConcern: presentingConcern || '',
      medicalHistory: medicalHistory || '',
      mentalHealthHistory: mentalHealthHistory || '',
      goals: goals || '',
      submittedAt: new Date(),
    };

    // Save auditable digital consent record
    if (consentAgreed) {
      client.consent = {
        agreed: true,
        timestamp: new Date(),
        ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Web Browser',
        consentVersion: 'v1.0-standard-telehealth-consent',
      };
    }

    await client.save();

    return res.json({
      success: true,
      message: 'Intake and consent recorded successfully',
      client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/clients/portal/me
 * @desc    Client portal data (only returns client's own info, upcoming sessions, and SHARED notes)
 * @access  Private (Client)
 */
const getClientPortalData = async (req, res, next) => {
  try {
    const client = await Client.findById(req.client._id).populate('therapist_id', 'name slug title profileImage sessionFee phone address');
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client record not found' });
    }

    const sessions = await Session.find({ client_id: client._id }).sort({ startTime: -1 });
    const payments = await Payment.find({ client_id: client._id, status: 'paid' }).sort({ createdAt: -1 });

    // CRITICAL SECURITY RULE:
    // Only return notes where type is 'shared' and project only non-confidential fields
    const sharedNotes = await SessionNote.find({
      client_id: client._id,
      type: 'shared',
    })
      .select('title content template sharedWithClientAt session_id createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      client,
      sessions,
      payments,
      sharedNotes, // Private notes strictly absent!
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  submitIntakeAndConsent,
  getClientPortalData,
};
