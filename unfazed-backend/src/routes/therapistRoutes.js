const express = require('express');
const router = express.Router();
const {
  getPublicProfile,
  updateProfile,
  getEntitlements,
  changeSubscriptionTier,
  getSubscriptionPlans,
} = require('../controllers/therapistController');
const { protectTherapist } = require('../middleware/authMiddleware');
const { captureProfileLead } = require('../services/leadDistributionService');

// Public routes
router.get('/public/:slug', getPublicProfile);
router.get('/plans', getSubscriptionPlans);
router.post('/lead', async (req, res, next) => {
  try {
    const lead = await captureProfileLead(req.body);
    res.status(201).json({ success: true, message: 'Inquiry received. The therapist will contact you shortly.', lead });
  } catch (err) {
    next(err);
  }
});

// Protected routes (Therapist)
router.put('/profile', protectTherapist, updateProfile);
router.get('/entitlements', protectTherapist, getEntitlements);
router.post('/upgrade-tier', protectTherapist, changeSubscriptionTier);

module.exports = router;
