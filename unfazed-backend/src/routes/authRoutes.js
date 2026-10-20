const express = require('express');
const router = express.Router();
const { registerTherapist, loginTherapist, getMe, clientLogin } = require('../controllers/authController');
const { protectTherapist } = require('../middleware/authMiddleware');

router.post('/register', registerTherapist);
router.post('/login', loginTherapist);
router.post('/client-login', clientLogin);
router.get('/me', protectTherapist, getMe);

module.exports = router;
