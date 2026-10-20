const Lead = require('../models/Lead');
const Therapist = require('../models/Therapist');
const { stubWhatsAppMessage, sendEmail } = require('./notificationService');

/**
 * Captures an incoming prospective client lead from the therapist's branded link
 */
const captureProfileLead = async ({ therapistId, name, email, phone, presentingConcern, notes }) => {
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    throw new Error('Therapist not found');
  }

  const lead = await Lead.create({
    therapist_id: therapistId,
    name,
    email,
    phone,
    presentingConcern,
    notes,
    source: 'branded_profile',
    status: 'new',
  });

  // Notify therapist about new prospective client inquiry
  const previewText = `New Lead Alert: ${name} (${phone || email}) sent an inquiry regarding: "${presentingConcern || 'General consultation'}". View in Unfazed CRM.`;
  await stubWhatsAppMessage({
    recipientPhone: therapist.phone || '+91 98765 43210',
    templateName: 'new_client_lead_alert',
    components: [],
    previewText,
  });

  await sendEmail({
    to: therapist.email,
    subject: `New Client Inquiry: ${name}`,
    text: previewText,
    html: `
      <div style="font-family: sans-serif; padding: 16px;">
        <h3 style="color: #0f766e;">New Client Inquiry Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Reason for Consultation:</strong> ${presentingConcern || 'N/A'}</p>
        <p><strong>Notes:</strong> ${notes || 'None'}</p>
      </div>
    `,
  });

  return lead;
};

module.exports = {
  captureProfileLead,
};
