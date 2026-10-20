const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Availability = require('../models/Availability');
const { generateUniqueSlug } = require('../utils/generateSlug');

const generateToken = (id, role = 'therapist') => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'unfazed_default_secret_key_2026',
    { expiresIn: '30d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new therapist and establish initial practice defaults
 * @access  Public
 */
const registerTherapist = async (req, res, next) => {
  try {
    const { name, email, password, title, bio, specializations, languages, sessionFee, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password',
      });
    }

    // Check if therapist already exists
    const existing = await Therapist.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A therapist account with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate guaranteed unique slug
    const slug = await generateUniqueSlug(Therapist, name);

    // Create therapist
    const therapist = await Therapist.create({
      name,
      email: email.toLowerCase(),
      password_hash,
      slug,
      title: title || 'Licensed Clinical Psychologist',
      bio: bio || 'Compassionate, evidence-based psychological care.',
      specializations: specializations || ['Anxiety & Depression', 'CBT', 'Stress Management'],
      languages: languages || ['English', 'Hindi'],
      sessionFee: sessionFee || 1500,
      phone: phone || '+91 98765 43210',
      tier: 'starter',
    });

    // Create default availability schedule for therapist (Mon-Fri 09:00 - 17:00)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklySchedule = days.map((dayName, idx) => ({
      dayOfWeek: idx,
      dayName,
      enabled: idx >= 1 && idx <= 5, // Active Mon-Fri
      slots: idx >= 1 && idx <= 5 ? [{ startTime: '10:00', endTime: '18:00' }] : [],
    }));

    await Availability.create({
      therapist_id: therapist._id,
      timezone: 'Asia/Kolkata',
      bufferTime: 15,
      slotDurations: [30, 45, 50, 60],
      defaultDuration: 50,
      weeklySchedule,
      oneTimeOverrides: [],
      blockedDates: [],
    });

    const token = generateToken(therapist._id, 'therapist');

    return res.status(201).json({
      success: true,
      token,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        title: therapist.title,
        tier: therapist.tier,
        profileImage: therapist.profileImage,
        sessionFee: therapist.sessionFee,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate therapist & get token
 * @access  Public
 */
const loginTherapist = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    const therapist = await Therapist.findOne({ email: email.toLowerCase() }).select('+password_hash');
    if (!therapist) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, therapist.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const token = generateToken(therapist._id, 'therapist');

    return res.json({
      success: true,
      token,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        title: therapist.title,
        tier: therapist.tier,
        profileImage: therapist.profileImage,
        sessionFee: therapist.sessionFee,
        currency: therapist.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in therapist profile
 * @access  Private (Therapist)
 */
const getMe = async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.therapist._id);
    return res.json({
      success: true,
      therapist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/client-login
 * @desc    Client login / email verification for client portal
 * @access  Public
 */
const clientLogin = async (req, res, next) => {
  try {
    const { email, therapistSlug } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide client email address',
      });
    }

    let therapistQuery = {};
    if (therapistSlug) {
      const therapist = await Therapist.findOne({ slug: therapistSlug.toLowerCase() });
      if (therapist) therapistQuery.therapist_id = therapist._id;
    }

    const client = await Client.findOne({
      email: email.toLowerCase(),
      ...therapistQuery,
    }).populate('therapist_id', 'name slug title profileImage phone');

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'No active client record found with this email. Please book your first session.',
      });
    }

    const token = generateToken(client._id, 'client');

    return res.json({
      success: true,
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: client.status,
        therapist: client.therapist_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerTherapist,
  loginTherapist,
  getMe,
  clientLogin,
};
