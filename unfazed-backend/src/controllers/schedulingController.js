const Availability = require('../models/Availability');
const Session = require('../models/Session');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');
const Payment = require('../models/Payment');
const { sendBookingConfirmation, stubWhatsAppMessage } = require('../services/notificationService');

/**
 * @route   GET /api/scheduling/availability
 * @desc    Get therapist's availability rules & settings
 * @access  Private (Therapist)
 */
const getTherapistAvailability = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    let availability = await Availability.findOne({ therapist_id: therapistId });

    if (!availability) {
      // Create defaults
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weeklySchedule = days.map((dayName, idx) => ({
        dayOfWeek: idx,
        dayName,
        enabled: idx >= 1 && idx <= 5,
        slots: idx >= 1 && idx <= 5 ? [{ startTime: '10:00', endTime: '18:00' }] : [],
      }));

      availability = await Availability.create({
        therapist_id: therapistId,
        timezone: 'Asia/Kolkata',
        bufferTime: 15,
        slotDurations: [30, 45, 50, 60],
        defaultDuration: 50,
        weeklySchedule,
        oneTimeOverrides: [],
        blockedDates: [],
        waitlist: [],
      });
    }

    return res.json({ success: true, availability });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/scheduling/availability
 * @desc    Update therapist's availability rules
 * @access  Private (Therapist)
 */
const updateTherapistAvailability = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { bufferTime, slotDurations, defaultDuration, weeklySchedule, oneTimeOverrides, blockedDates, timezone } = req.body;

    let availability = await Availability.findOne({ therapist_id: therapistId });
    if (!availability) {
      availability = new Availability({ therapist_id: therapistId });
    }

    if (bufferTime !== undefined) availability.bufferTime = bufferTime;
    if (slotDurations) availability.slotDurations = slotDurations;
    if (defaultDuration) availability.defaultDuration = defaultDuration;
    if (weeklySchedule) availability.weeklySchedule = weeklySchedule;
    if (oneTimeOverrides) availability.oneTimeOverrides = oneTimeOverrides;
    if (blockedDates) availability.blockedDates = blockedDates;
    if (timezone) availability.timezone = timezone;

    await availability.save();

    return res.json({ success: true, availability });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to compute available time slots on a given date considering weekly schedule, overrides, and existing bookings
 */
const calculateSlotsForDate = (dateStr, availability, existingSessions, durationMinutes = 50) => {
  const dateObj = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = dateObj.getUTCDay(); // 0-6

  // 1. Check if date is in blockedDates
  if (availability.blockedDates && availability.blockedDates.includes(dateStr)) {
    return [];
  }

  // 2. Check for one-time overrides
  const override = availability.oneTimeOverrides?.find((o) => o.date === dateStr);
  let activeSlots = [];

  if (override) {
    if (!override.isAvailable) return [];
    activeSlots = override.slots || [];
  } else {
    // 3. Fallback to weekly schedule
    const dayConfig = availability.weeklySchedule?.find((d) => d.dayOfWeek === dayOfWeek);
    if (!dayConfig || !dayConfig.enabled) return [];
    activeSlots = dayConfig.slots || [];
  }

  const buffer = availability.bufferTime || 15;
  const computedSlots = [];

  // Generate candidate slots within each available window
  for (const window of activeSlots) {
    const [startH, startM] = window.startTime.split(':').map(Number);
    const [endH, endM] = window.endTime.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const windowEndMinutes = endH * 60 + endM;

    while (currentMinutes + durationMinutes <= windowEndMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60);
      const slotStartM = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + durationMinutes;
      const slotEndH = Math.floor(slotEndMinutes / 60);
      const slotEndM = slotEndMinutes % 60;

      const slotStartISO = new Date(`${dateStr}T${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}:00Z`);
      const slotEndISO = new Date(`${dateStr}T${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}:00Z`);

      // Check collision with existing active sessions
      const hasConflict = existingSessions.some((session) => {
        const sessStart = new Date(session.startTime).getTime();
        const sessEnd = new Date(session.endTime).getTime();
        const curStart = slotStartISO.getTime();
        const curEnd = slotEndISO.getTime();

        return (
          (curStart >= sessStart && curStart < sessEnd) ||
          (curEnd > sessStart && curEnd <= sessEnd) ||
          (curStart <= sessStart && curEnd >= sessEnd)
        );
      });

      if (!hasConflict) {
        computedSlots.push({
          startTime: slotStartISO.toISOString(),
          endTime: slotEndISO.toISOString(),
          displayTime: `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`,
          duration: durationMinutes,
        });
      }

      currentMinutes += durationMinutes + buffer;
    }
  }

  return computedSlots;
};

/**
 * @route   GET /api/scheduling/public-slots
 * @desc    Get open available slots for a given date in client's local timezone
 * @access  Public
 */
const getPublicAvailableSlots = async (req, res, next) => {
  try {
    const { therapistSlug, therapistId, date, duration } = req.query;

    let targetTherapistId = therapistId;
    if (!targetTherapistId && therapistSlug) {
      const therapist = await Therapist.findOne({ slug: therapistSlug.toLowerCase() });
      if (!therapist) {
        return res.status(404).json({ success: false, error: 'Therapist not found' });
      }
      targetTherapistId = therapist._id;
    }

    if (!targetTherapistId || !date) {
      return res.status(400).json({ success: false, error: 'Therapist and date (YYYY-MM-DD) are required' });
    }

    const availability = await Availability.findOne({ therapist_id: targetTherapistId });
    if (!availability) {
      return res.json({ success: true, slots: [] });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const existingSessions = await Session.find({
      therapist_id: targetTherapistId,
      status: { $nin: ['cancelled'] },
      startTime: { $gte: startOfDay, $lte: endOfDay },
    });

    const sessionDuration = Number(duration) || availability.defaultDuration || 50;
    const slots = calculateSlotsForDate(date, availability, existingSessions, sessionDuration);

    return res.json({
      success: true,
      date,
      slotsCount: slots.length,
      slots,
      isFullyBooked: slots.length === 0,
      therapistTimezone: availability.timezone,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/scheduling/book-slot
 * @desc    Slot booking logic with instant confirmation and double-booking prevention
 * @access  Public
 */
const bookSlot = async (req, res, next) => {
  try {
    const {
      therapistId,
      therapistSlug,
      clientName,
      clientEmail,
      clientPhone,
      startTime,
      duration = 50,
      type = 'individual',
      notes,
    } = req.body;

    let targetTherapistId = therapistId;
    let therapist = null;

    if (!targetTherapistId && therapistSlug) {
      therapist = await Therapist.findOne({ slug: therapistSlug.toLowerCase() });
      if (therapist) targetTherapistId = therapist._id;
    } else {
      therapist = await Therapist.findById(targetTherapistId);
    }

    if (!therapist) {
      return res.status(404).json({ success: false, error: 'Therapist not found' });
    }

    if (!clientName || !clientEmail || !startTime) {
      return res.status(400).json({ success: false, error: 'Client name, email and session start time are required' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // CRITICAL: Double-booking prevention check
    const conflictingSession = await Session.findOne({
      therapist_id: therapist._id,
      status: { $nin: ['cancelled'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (conflictingSession) {
      return res.status(409).json({
        success: false,
        error: 'This slot was just booked by another client. Please select another slot.',
        doubleBookingPrevented: true,
      });
    }

    // Find or create Client record under this therapist
    let client = await Client.findOne({
      therapist_id: therapist._id,
      email: clientEmail.toLowerCase(),
    });

    if (!client) {
      client = await Client.create({
        therapist_id: therapist._id,
        name: clientName,
        email: clientEmail.toLowerCase(),
        phone: clientPhone || '',
        status: 'active',
        tags: ['web-booking'],
      });
    } else {
      // Update phone if provided
      if (clientPhone && !client.phone) {
        client.phone = clientPhone;
        await client.save();
      }
    }

    // Create Session
    const session = await Session.create({
      therapist_id: therapist._id,
      client_id: client._id,
      clientName: client.name,
      clientEmail: client.email,
      startTime: start,
      endTime: end,
      duration,
      type,
      fee: therapist.sessionFee || 1500,
      currency: therapist.currency || 'INR',
      meetingLink: `https://meet.google.com/unfazed-${therapist.slug}-${Date.now().toString().slice(-4)}`,
      notes: notes || '',
      status: 'confirmed',
    });

    // Update client stats
    client.lastSessionDate = start;
    client.totalSessionsCount = (client.totalSessionsCount || 0) + 1;
    await client.save();

    // Fire notification event (Booking confirmation via email & WhatsApp stub)
    try {
      await sendBookingConfirmation({ therapist, client, session });
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Session successfully booked and confirmed!',
      session,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/scheduling/waitlist
 * @desc    Join waitlist when slots are full
 * @access  Public
 */
const joinWaitlist = async (req, res, next) => {
  try {
    const { therapistId, clientName, clientEmail, clientPhone, preferredDate, preferredTimeRange } = req.body;

    let availability = await Availability.findOne({ therapist_id: therapistId });
    if (!availability) {
      return res.status(404).json({ success: false, error: 'Therapist availability schedule not found' });
    }

    availability.waitlist.push({
      clientName,
      clientEmail,
      clientPhone,
      preferredDate,
      preferredTimeRange,
      notified: false,
      createdAt: new Date(),
    });

    await availability.save();

    return res.json({
      success: true,
      message: 'You have been added to the waitlist. You will be automatically notified if a slot opens up!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/scheduling/sessions
 * @desc    Get therapist's sessions (upcoming, past, filterable)
 * @access  Private (Therapist)
 */
const getTherapistSessions = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { status, timeframe } = req.query;

    const query = { therapist_id: therapistId };
    if (status) query.status = status;

    const now = new Date();
    if (timeframe === 'upcoming') {
      query.startTime = { $gte: now };
    } else if (timeframe === 'past') {
      query.startTime = { $lt: now };
    }

    const sessions = await Session.find(query)
      .populate('client_id', 'name email phone tags status')
      .sort({ startTime: timeframe === 'past' ? -1 : 1 });

    return res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/scheduling/sessions/:id/status
 * @desc    Update session status (completed, cancelled, no-show)
 * @access  Private (Therapist)
 */
const updateSessionStatus = async (req, res, next) => {
  try {
    const therapistId = req.therapist._id;
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const session = await Session.findOne({ _id: id, therapist_id: therapistId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.status = status;
    if (cancellationReason) session.cancellationReason = cancellationReason;
    await session.save();

    // If cancelled, check waitlist for this therapist and notify first waitlisted client (stretch goal)
    if (status === 'cancelled') {
      const availability = await Availability.findOne({ therapist_id: therapistId });
      const pendingWaitlist = availability?.waitlist?.filter((w) => !w.notified) || [];
      if (pendingWaitlist.length > 0) {
        const nextPerson = pendingWaitlist[0];
        nextPerson.notified = true;
        await availability.save();

        await stubWhatsAppMessage({
          recipientPhone: nextPerson.clientPhone || '+91 99999 00000',
          templateName: 'waitlist_slot_opened',
          components: [],
          previewText: `Great news ${nextPerson.clientName}! A slot has just freed up with your therapist on ${new Date(session.startTime).toDateString()}. Book now to secure it.`,
        });
      }
    }

    return res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTherapistAvailability,
  updateTherapistAvailability,
  getPublicAvailableSlots,
  bookSlot,
  joinWaitlist,
  getTherapistSessions,
  updateSessionStatus,
};
