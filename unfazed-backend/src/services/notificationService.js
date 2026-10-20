const nodemailer = require('nodemailer');

// In-memory queue to inspect stubbed WhatsApp outgoing messages
const whatsAppQueue = [];

// Configure Nodemailer transporter (Ethereal/fallback or env SMTP)
let transporter = null;
try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development / demo fallback
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'demo@ethereal.email',
        pass: 'demo-secret',
      },
    });
  }
} catch (e) {
  console.warn('[Notification Service] Nodemailer setup warning:', e.message);
}

/**
 * WhatsApp Business API stub: simulates queuing and sending official WhatsApp HSM templates
 */
const stubWhatsAppMessage = async ({ recipientPhone, templateName, components, previewText }) => {
  const queuedMessage = {
    id: `wa_msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    recipientPhone,
    templateName,
    components,
    previewText,
    status: 'sent_simulated',
    dispatchedAt: new Date(),
  };

  whatsAppQueue.unshift(queuedMessage);
  if (whatsAppQueue.length > 100) whatsAppQueue.pop(); // Keep last 100

  console.log(`\n======================================================`);
  console.log(`[WhatsApp Business API STUB Event]`);
  console.log(`To: ${recipientPhone}`);
  console.log(`Template: ${templateName}`);
  console.log(`Message Body:\n${previewText}`);
  console.log(`======================================================\n`);

  return queuedMessage;
};

/**
 * Sends Email notification
 */
const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`[Notification Service] Sending email to: ${to} | Subject: "${subject}"`);
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Unfazed Therapy Practice" <no-reply@unfazed.in>',
        to,
        subject,
        text,
        html,
      });
    } else {
      console.log(`[Notification Service - Demo Mode] Email dispatched (simulated):\n${text || html}`);
    }
    return { success: true };
  } catch (err) {
    console.warn(`[Notification Service] Email delivery warning (non-fatal):`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Event: Booking Confirmed
 */
const sendBookingConfirmation = async ({ therapist, client, session }) => {
  const formattedTime = new Date(session.startTime).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const messageText = `Namaste ${client.name}! Your therapy appointment with ${therapist.name} has been confirmed for ${formattedTime} IST. Join securely via: ${session.meetingLink || 'Link provided in portal'}. We look forward to supporting your journey. - Team Unfazed`;

  // 1. Dispatch WhatsApp Stub
  await stubWhatsAppMessage({
    recipientPhone: client.phone || '+91 99999 00000',
    templateName: 'therapy_booking_confirmed_v1',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: client.name }, { type: 'text', text: therapist.name }, { type: 'text', text: formattedTime }] },
    ],
    previewText: messageText,
  });

  // 2. Dispatch Email
  await sendEmail({
    to: client.email,
    subject: `Confirmed: Therapy Session with ${therapist.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488;">Session Confirmed</h2>
        <p>Dear ${client.name},</p>
        <p>Your session with <strong>${therapist.name}</strong> is scheduled for:</p>
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; color: #115e59;">${formattedTime} IST</p>
          <p style="margin: 4px 0 0 0; color: #047857;">Duration: ${session.duration} minutes</p>
        </div>
        <p><strong>Join Meeting:</strong> <a href="${session.meetingLink}" style="color: #0d9488;">${session.meetingLink}</a></p>
        <p style="margin-top: 24px; font-size: 14px; color: #64748b;">With care,<br/>${therapist.name} & The Unfazed Care Team</p>
      </div>
    `,
    text: messageText,
  });
};

/**
 * Event: 24-Hour Reminder
 */
const send24HourReminder = async ({ therapist, client, session }) => {
  const formattedTime = new Date(session.startTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const previewText = `Reminder: Hi ${client.name}, your consultation with ${therapist.name} is tomorrow at ${formattedTime} IST. Please ensure a quiet, private space. Access your portal: https://unfazed.in/portal`;

  await stubWhatsAppMessage({
    recipientPhone: client.phone || '+91 99999 00000',
    templateName: 'session_24hr_reminder',
    components: [],
    previewText,
  });

  await sendEmail({
    to: client.email,
    subject: `Reminder: Therapy Session tomorrow with ${therapist.name}`,
    text: previewText,
    html: `<p>${previewText}</p>`,
  });
};

/**
 * Event: Post-Session Follow-up
 */
const sendPostSessionFollowup = async ({ therapist, client, session }) => {
  const previewText = `Hi ${client.name}, thank you for attending your session today with ${therapist.name}. Any shared reflections, exercises, or next steps are available in your Unfazed Client Portal. Take gentle care of yourself.`;

  await stubWhatsAppMessage({
    recipientPhone: client.phone || '+91 99999 00000',
    templateName: 'post_session_followup',
    components: [],
    previewText,
  });

  await sendEmail({
    to: client.email,
    subject: `Reflections & Next Steps: Session with ${therapist.name}`,
    text: previewText,
    html: `<p>${previewText}</p>`,
  });
};

/**
 * Event: Payment Received & Invoice Ready
 */
const sendPaymentReceipt = async ({ therapist, client, payment }) => {
  const previewText = `Receipt: Hi ${client.name}, payment of INR ${payment.amount} for your therapy session has been received. Invoice #${payment.invoiceNumber} is now ready to view.`;

  await stubWhatsAppMessage({
    recipientPhone: client.phone || '+91 99999 00000',
    templateName: 'payment_receipt_issued',
    components: [],
    previewText,
  });

  await sendEmail({
    to: client.email,
    subject: `Payment Receipt #${payment.invoiceNumber} - ${therapist.name}`,
    text: previewText,
    html: `<p>${previewText}</p>`,
  });
};

const getWhatsAppQueue = () => whatsAppQueue;

module.exports = {
  stubWhatsAppMessage,
  sendEmail,
  sendBookingConfirmation,
  send24HourReminder,
  sendPostSessionFollowup,
  sendPaymentReceipt,
  getWhatsAppQueue,
};
