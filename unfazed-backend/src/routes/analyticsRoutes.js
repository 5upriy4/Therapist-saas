const express = require('express');
const router = express.Router();
const { getPracticeAnalytics } = require('../controllers/analyticsController');
const { protectTherapist } = require('../middleware/authMiddleware');

router.get('/dashboard', protectTherapist, getPracticeAnalytics);

module.exports = router;
