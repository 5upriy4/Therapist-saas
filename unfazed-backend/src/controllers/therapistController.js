const Therapist = require('../models/Therapist');
const Package = require('../models/Package');
const Availability = require('../models/Availability');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { getTherapistEntitlements } = require('../services/entitlementService');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');

/**
 * @route   GET /api/therapist/public/:slug
 * @desc    Fetch public branded profile for client view (e.g. /dr-sharma)
 * @access  Public
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const therapist = await Therapist.findOne({ slug: slug.toLowerCase(), isActive: true });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: `Therapist profile '/${slug}' not found.`,
      });
    }

    // Get active session packages created by this therapist
    const packages = await Package.find({ therapist_id: therapist._id, isActive: true });

    // Get basic availability configuration
    const availability = await Availability.findOne({ therapist_id: therapist._id }).select(
      'timezone slotDurations defaultDuration weeklySchedule'
    );

    // Build Open Graph meta details for shareability
    const meta = {
      title: `${therapist.name} - ${therapist.title} | Unfazed`,
      description: therapist.bio || `Book a private therapy session with ${therapist.name}.`,
      image: therapist.profileImage,
      url: `https://unfazed.in/${therapist.slug}`,
    };

    return res.json({
      success: true,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        slug: therapist.slug,
        title: therapist.title,
        bio: therapist.bio,
        specializations: therapist.specializations,
        languages: therapist.languages,
        experienceYears: therapist.experienceYears,
        education: therapist.education,
        profileImage: therapist.profileImage,
        coverImage: therapist.coverImage,
        sessionFee: therapist.sessionFee,
        sessionDuration: therapist.sessionDuration,
        currency: therapist.currency,
        address: therapist.address,
        socialLinks: therapist.socialLinks,
      },
      packages,
      availability,
      meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/therapist/profile
 * @desc    Update therapist practice profile
 * @access  Private (Therapist)
 */
const updateProfile = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const {
      name,
      title,
      bio,
      specializations,
      languages,
      experienceYears,
      education,
      sessionFee,
      sessionDuration,
      phone,
      address,
      socialLinks,
      profileImage,
      coverImage,
    } = req.body;

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return res.status(404).json({ success: false, error: 'Therapist not found' });
    }

    if (name) therapist.name = name;
    if (title) therapist.title = title;
    if (bio !== undefined) therapist.bio = bio;
    if (specializations) therapist.specializations = specializations;
    if (languages) therapist.languages = languages;
    if (experienceYears !== undefined) therapist.experienceYears = experienceYears;
    if (education) therapist.education = education;
    if (sessionFee !== undefined) therapist.sessionFee = sessionFee;
    if (sessionDuration !== undefined) therapist.sessionDuration = sessionDuration;
    if (phone) therapist.phone = phone;
    if (address) therapist.address = { ...therapist.address, ...address };
    if (socialLinks) therapist.socialLinks = { ...therapist.socialLinks, ...socialLinks };
    if (profileImage) therapist.profileImage = profileImage;
    if (coverImage) therapist.coverImage = coverImage;

    await therapist.save();

    return res.json({
      success: true,
      therapist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/therapist/entitlements
 * @desc    Get therapist's active plan, limits, and feature flags
 * @access  Private (Therapist)
 */
const getEntitlements = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const data = await getTherapistEntitlements(therapistId);
    return res.json({
      success: true,
      entitlements: data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/therapist/upgrade-tier
 * @desc    Change/upgrade subscription plan (demonstrates dynamic tier switching & immediate feature unblocking)
 * @access  Private (Therapist)
 */
const changeSubscriptionTier = async (req, res, next) => {
  try {
    const { tierKey } = req.body;
    const validTiers = ['starter', 'growth', 'practice'];

    if (!validTiers.includes(tierKey?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
      });
    }

    const therapist = await Therapist.findById(req.therapist._id);
    therapist.tier = tierKey.toLowerCase();
    await therapist.save();

    const updatedEntitlements = await getTherapistEntitlements(therapist._id);

    return res.json({
      success: true,
      message: `Successfully upgraded to ${tierKey.toUpperCase()} tier!`,
      tier: therapist.tier,
      entitlements: updatedEntitlements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/therapist/plans
 * @desc    Get all available subscription tiers
 * @access  Public
 */
const getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionTierConfig.find().sort({ priceINR: 1 });
    return res.json({
      success: true,
      plans,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicProfile,
  updateProfile,
  getEntitlements,
  changeSubscriptionTier,
  getSubscriptionPlans,
};
