const express = require('express');
const router = express.Router();
const {
  saveNote,
  getSessionNotesForTherapist,
  getClientSharedNotes,
  deleteNote,
} = require('../controllers/noteController');
const { protectTherapist, protectClient } = require('../middleware/authMiddleware');

// Client facing route (STRICT SECURITY: only shared notes, no private notes)
router.get('/client-facing', protectClient, getClientSharedNotes);

// Protected routes (Therapist clinical documentation)
router.post('/', protectTherapist, saveNote);
router.get('/session/:sessionId', protectTherapist, getSessionNotesForTherapist);
router.delete('/:id', protectTherapist, deleteNote);

module.exports = router;
