const SessionNote = require('../models/SessionNote');
const Session = require('../models/Session');
const Client = require('../models/Client');
const { canAccess } = require('../services/entitlementService');

/**
 * @route   POST /api/notes
 * @desc    Create or update clinical session note
 *          Gated by NOTE_TEMPLATE entitlement when using structured SOAP / DAP templates
 * @access  Private (Therapist)
 */
const saveNote = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { noteId, sessionId, clientId, type = 'private', template = 'freeform', title, content, structuredFields } = req.body;

    if (!sessionId || !clientId) {
      return res.status(400).json({ success: false, error: 'Session ID and Client ID are required' });
    }

    // Verify session belongs to therapist
    const session = await Session.findOne({ _id: sessionId, therapist_id: therapistId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or unauthorized' });
    }

    // Centralized Entitlement Check for structured clinical templates (SOAP / DAP)
    if (template !== 'freeform') {
      const check = await canAccess(therapistId, 'NOTE_TEMPLATE', { template });
      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          error: check.reason,
          upgradeRequired: true,
          requiredTier: 'Growth or Practice Tier',
        });
      }
    }

    let note = null;
    if (noteId) {
      note = await SessionNote.findOne({ _id: noteId, therapist_id: therapistId });
    }

    if (!note) {
      note = new SessionNote({
        therapist_id: therapistId,
        session_id: sessionId,
        client_id: clientId,
      });
    }

    note.type = type; // 'private' or 'shared'
    note.template = template; // 'freeform', 'soap', 'dap'
    note.title = title || (type === 'private' ? 'Internal Clinical Note' : 'Session Summary & Shared Reflections');
    note.content = content || '';

    if (structuredFields) {
      note.structuredFields = { ...note.structuredFields, ...structuredFields };
    }

    if (type === 'shared' && !note.sharedWithClientAt) {
      note.sharedWithClientAt = new Date();
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message: type === 'private' ? 'Private clinical note saved' : 'Note saved and made visible to client in portal',
      note,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/session/:sessionId
 * @desc    Therapist views all notes for a specific session (both private and shared)
 * @access  Private (Therapist)
 */
const getSessionNotesForTherapist = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { sessionId } = req.params;

    const notes = await SessionNote.find({
      session_id: sessionId,
      therapist_id: therapistId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes/client-facing
 * @desc    STRICT API SERIALIZER: Client fetches their shared session notes
 *          Under NO circumstances can private clinical notes ever be leaked or returned here!
 * @access  Private (Client)
 */
const getClientSharedNotes = async (req, res, next) => {
  try {
    const clientId = req.client._id;

    // Hard-enforced query and projection:
    // 1. type must strictly be 'shared'
    // 2. private notes are completely filtered out in Mongo query
    // 3. serializer projection omits internal therapist metadata
    const sharedNotes = await SessionNote.find({
      client_id: clientId,
      type: 'shared', // HARD CONSTRAINT: NEVER 'private'
    })
      .select('title content template sharedWithClientAt session_id createdAt')
      .populate('session_id', 'startTime duration type')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: sharedNotes.length,
      notes: sharedNotes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete clinical note
 * @access  Private (Therapist)
 */
const deleteNote = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { id } = req.params;

    const note = await SessionNote.findOneAndDelete({ _id: id, therapist_id: therapistId });
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    return res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveNote,
  getSessionNotesForTherapist,
  getClientSharedNotes,
  deleteNote,
};
