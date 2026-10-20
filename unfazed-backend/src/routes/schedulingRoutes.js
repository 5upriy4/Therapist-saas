const express = require('express');
const router = express.Router();
const {
  getTherapistAvailability,
  updateTherapistAvailability,
  getPublicAvailableSlots,
  bookSlot,
  joinWaitlist,
  getTherapistSessions,
  updateSessionStatus,
} = require('../controllers/schedulingController');
const { protectTherapist } = require('../middleware/authMiddleware');

// Public booking routes
router.get('/public-slots', getPublicAvailableSlots);
router.post('/book-slot', bookSlot);
router.post('/waitlist', joinWaitlist);

// Protected routes (Therapist Schedule management)
router.get('/availability', protectTherapist, getTherapistAvailability);
router.put('/availability', protectTherapist, updateTherapistAvailability);
router.get('/sessions', protectTherapist, getTherapistSessions);
router.put('/sessions/:id/status', protectTherapist, updateSessionStatus);

module.exports = router;
