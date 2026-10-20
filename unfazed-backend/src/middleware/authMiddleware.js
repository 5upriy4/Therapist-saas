const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');

/**
 * Protects therapist routes
 */
const protectTherapist = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unfazed_default_secret_key_2026');
    const therapist = await Therapist.findById(decoded.id).select('-password_hash');

    if (!therapist) {
      return res.status(401).json({
        success: false,
        error: 'Therapist account not found or has been disabled',
      });
    }

    req.therapist = therapist;
    req.user = { id: therapist._id, role: 'therapist' };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, invalid token',
    });
  }
};

/**
 * Client authentication for portal & client session access
 */
const protectClient = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized as client, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unfazed_default_secret_key_2026');
    const client = await Client.findById(decoded.id);

    if (!client) {
      return res.status(401).json({
        success: false,
        error: 'Client record not found',
      });
    }

    req.client = client;
    req.user = { id: client._id, role: 'client' };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized as client, invalid token',
    });
  }
};

module.exports = {
  protectTherapist,
  protectClient,
};
