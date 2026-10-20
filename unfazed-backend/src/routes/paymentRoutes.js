const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  downloadInvoice,
  getTherapistPayments,
  createPackage,
  getTherapistPackages,
} = require('../controllers/paymentController');
const { protectTherapist } = require('../middleware/authMiddleware');

// Public checkout & webhook
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);
router.get('/invoice/:id', downloadInvoice);

// Therapist billing & packages
router.get('/therapist-payments', protectTherapist, getTherapistPayments);
router.post('/packages', protectTherapist, createPackage);
router.get('/packages', protectTherapist, getTherapistPackages);

module.exports = router;
