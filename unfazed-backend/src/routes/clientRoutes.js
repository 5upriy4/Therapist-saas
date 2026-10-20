const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  submitIntakeAndConsent,
  getClientPortalData,
} = require('../controllers/clientController');
const { protectTherapist, protectClient } = require('../middleware/authMiddleware');

// Client portal route (Strictly private for authenticated client)
router.get('/portal/me', protectClient, getClientPortalData);

// Public intake & digital consent submission
router.post('/intake-and-consent', submitIntakeAndConsent);

// Protected routes (Therapist CRM)
router.get('/', protectTherapist, getClients);
router.post('/', protectTherapist, createClient);
router.get('/:id', protectTherapist, getClientById);
router.put('/:id', protectTherapist, updateClient);

module.exports = router;
