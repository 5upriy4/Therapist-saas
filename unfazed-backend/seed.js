const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const SubscriptionTierConfig = require('./src/models/SubscriptionTierConfig');
const Therapist = require('./src/models/Therapist');
const Client = require('./src/models/Client');
const Session = require('./src/models/Session');
const SessionNote = require('./src/models/SessionNote');
const Availability = require('./src/models/Availability');
const Payment = require('./src/models/Payment');
const Package = require('./src/models/Package');
const ClientPackage = require('./src/models/ClientPackage');
const Lead = require('./src/models/Lead');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unfazed';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await SubscriptionTierConfig.deleteMany({});
    await Therapist.deleteMany({});
    await Client.deleteMany({});
    await Session.deleteMany({});
    await SessionNote.deleteMany({});
    await Availability.deleteMany({});
    await Payment.deleteMany({});
    await Package.deleteMany({});
    await ClientPackage.deleteMany({});
    await Lead.deleteMany({});

    // 1. Seed Subscription Tier Configs
    console.log('[Seed] Seeding SubscriptionTierConfigs...');
    const tierConfigs = await SubscriptionTierConfig.create([
      {
        tierKey: 'starter',
        name: 'Starter Tier',
        tagline: 'Ideal for independent therapists launching their practice',
        priceINR: 0,
        billingCycle: 'monthly',
        isDefault: true,
        features: {
          maxActiveClients: 5,
          allowedNoteTemplates: ['freeform'],
          analyticsDepth: 'basic',
          customBranding: false,
          realTimeChat: true,
          packageManagement: false,
          automatedReminders: true,
        },
      },
      {
        tierKey: 'growth',
        name: 'Growth Tier',
        tagline: 'For established practitioners scaling caseloads',
        priceINR: 1999,
        billingCycle: 'monthly',
        features: {
          maxActiveClients: 25,
          allowedNoteTemplates: ['freeform', 'soap'],
          analyticsDepth: 'advanced',
          customBranding: true,
          realTimeChat: true,
          packageManagement: true,
          automatedReminders: true,
        },
      },
      {
        tierKey: 'practice',
        name: 'Practice Tier',
        tagline: 'Complete autonomy, unlimited clients & institutional clinical suite',
        priceINR: 4999,
        billingCycle: 'monthly',
        features: {
          maxActiveClients: 999999,
          allowedNoteTemplates: ['freeform', 'soap', 'dap'],
          analyticsDepth: 'advanced',
          customBranding: true,
          realTimeChat: true,
          packageManagement: true,
          automatedReminders: true,
        },
      },
    ]);

    // 2. Seed Therapists
    console.log('[Seed] Seeding Therapists...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const drSharma = await Therapist.create({
      name: 'Dr. Priya Sharma',
      email: 'dr.sharma@unfazed.in',
      password_hash: passwordHash,
      slug: 'dr-sharma',
      title: 'Consultant Clinical Psychologist (RCI Registered)',
      bio: 'Over 8 years of clinical practice specializing in Cognitive Behavioral Therapy (CBT), adult anxiety disorders, trauma recovery, and mindful emotional resilience. Dedicated to providing a safe, affirmative, and confidential therapeutic container.',
      specializations: [
        'Anxiety & Panic Disorders',
        'Cognitive Behavioral Therapy (CBT)',
        'Trauma Recovery & EMDR',
        'Burnout & Workplace Stress',
        'Affirmative Queer Therapy',
      ],
      languages: ['English', 'Hindi', 'Kannada'],
      experienceYears: 8,
      education: 'M.Phil Clinical Psychology (NIMHANS), RCI Reg. #A49182',
      profileImage: 'https://images.unsplash.com/photo-1594824813511-13c54c340795?auto=format&fit=crop&w=600&q=80',
      coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80',
      sessionFee: 1800,
      sessionDuration: 50,
      currency: 'INR',
      tier: 'growth', // Set to growth tier so SOAP templates & packages are unlocked
      phone: '+91 98450 12345',
      address: {
        clinicName: 'Serene Mind Clinical Centre',
        street: '12th Main Road, HAL 2nd Stage, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        gstin: '29AABCS1429B1Z8',
      },
      socialLinks: {
        linkedin: 'https://linkedin.com/in/dr-priya-sharma',
        instagram: 'https://instagram.com/drpriyasharma_mind',
      },
    });

    const drVerma = await Therapist.create({
      name: 'Dr. Rohan Verma',
      email: 'dr.verma@unfazed.in',
      password_hash: passwordHash,
      slug: 'rohan-verma',
      title: 'Psychotherapist & Couples Counselor',
      bio: 'Psychodynamic psychotherapist helping couples and young professionals navigate relational conflicts, life transitions, and depressive episodes.',
      specializations: ['Couples Counseling', 'Depression & Grief', 'Psychodynamic Psychotherapy'],
      languages: ['English', 'Hindi'],
      experienceYears: 5,
      education: 'M.A. Applied Psychology (Delhi University)',
      sessionFee: 1500,
      sessionDuration: 50,
      tier: 'starter',
      phone: '+91 98110 54321',
    });

    // 3. Seed Availability Schedules
    console.log('[Seed] Seeding Availability Schedules...');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const drSharmaSchedule = days.map((dayName, idx) => ({
      dayOfWeek: idx,
      dayName,
      enabled: idx >= 1 && idx <= 5, // Mon-Fri
      slots: idx >= 1 && idx <= 5 ? [{ startTime: '09:00', endTime: '18:00' }] : [],
    }));

    await Availability.create({
      therapist_id: drSharma._id,
      timezone: 'Asia/Kolkata',
      bufferTime: 15,
      slotDurations: [30, 45, 50, 60],
      defaultDuration: 50,
      weeklySchedule: drSharmaSchedule,
      oneTimeOverrides: [],
      blockedDates: [],
      waitlist: [],
    });

    await Availability.create({
      therapist_id: drVerma._id,
      timezone: 'Asia/Kolkata',
      bufferTime: 15,
      slotDurations: [50],
      defaultDuration: 50,
      weeklySchedule: drSharmaSchedule,
      oneTimeOverrides: [],
      blockedDates: [],
      waitlist: [],
    });

    // 4. Seed Multi-Session Packages
    console.log('[Seed] Seeding Packages...');
    const pkg3 = await Package.create({
      therapist_id: drSharma._id,
      name: 'Anxiety Reset Package (3 Sessions)',
      sessionCount: 3,
      price: 4800,
      perSessionRate: 1600,
      validityDays: 60,
      description: 'Focused 3-session intervention covering anxiety triggers, somatic grounding, and cognitive reframing.',
      savingsPercentage: 11,
      isActive: true,
    });

    const pkg6 = await Package.create({
      therapist_id: drSharma._id,
      name: 'Deep Healing Journey (6 Sessions)',
      sessionCount: 6,
      price: 9000,
      perSessionRate: 1500,
      validityDays: 120,
      description: 'Comprehensive 6-session therapeutic arc for deep trauma processing, coping mechanism rebuilding, and relapse prevention.',
      savingsPercentage: 17,
      isActive: true,
    });

    // 5. Seed Clients
    console.log('[Seed] Seeding Clients with Intakes & Consent...');
    const clientAarav = await Client.create({
      therapist_id: drSharma._id,
      name: 'Aarav Mehta',
      email: 'aarav.mehta@example.com',
      phone: '+91 98200 11223',
      status: 'active',
      tags: ['anxiety', 'tech-worker', 'cbt'],
      intakeForm: {
        demographics: {
          age: 29,
          gender: 'male',
          occupation: 'Senior Software Engineer',
          emergencyContactName: 'Sunita Mehta',
          emergencyContactPhone: '+91 98200 44556',
          emergencyContactRelationship: 'Mother',
        },
        presentingConcern: 'Severe imposter syndrome and panic attacks before major product releases.',
        medicalHistory: 'Mild acid reflux; no current psychiatric medications.',
        mentalHealthHistory: 'First time seeking psychotherapy.',
        goals: 'Learn tangible grounding techniques to manage panic spikes and uncouple self-worth from work performance.',
        preferredLanguage: 'English',
        submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      consent: {
        agreed: true,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ipAddress: '106.51.72.18',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        consentVersion: 'v1.0-standard-telehealth-consent',
      },
      lastSessionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      totalSessionsCount: 4,
    });

    const clientAnanya = await Client.create({
      therapist_id: drSharma._id,
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      phone: '+91 97411 98765',
      status: 'active',
      tags: ['trauma', 'emdr', 'high-priority'],
      intakeForm: {
        demographics: {
          age: 34,
          gender: 'female',
          occupation: 'Architectural Designer',
          emergencyContactName: 'Karthik Iyer',
          emergencyContactPhone: '+91 97411 11223',
          emergencyContactRelationship: 'Spouse',
        },
        presentingConcern: 'Lingering PTSD symptoms and hypervigilance following a road traffic accident last year.',
        medicalHistory: 'Orthopedic recovery completed; sleep disturbances.',
        mentalHealthHistory: 'Attended grief counseling 4 years ago.',
        goals: 'Reduce emotional reactivity when driving and restore peaceful sleep hygiene.',
        preferredLanguage: 'English',
        submittedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      consent: {
        agreed: true,
        timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        ipAddress: '157.49.201.32',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)',
        consentVersion: 'v1.0-standard-telehealth-consent',
      },
      lastSessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      totalSessionsCount: 5,
    });

    const clientVikram = await Client.create({
      therapist_id: drSharma._id,
      name: 'Vikram Sengupta',
      email: 'vikram.sengupta@example.com',
      phone: '+91 98300 45678',
      status: 'active',
      tags: ['burnout', 'leadership'],
      totalSessionsCount: 2,
    });

    const clientRiya = await Client.create({
      therapist_id: drSharma._id,
      name: 'Riya Kulkarni',
      email: 'riya.kulkarni@example.com',
      phone: '+91 99220 88776',
      status: 'completed',
      tags: ['stress-management'],
      totalSessionsCount: 6,
    });

    // 6. Seed ClientPackage for Aarav
    await ClientPackage.create({
      client_id: clientAarav._id,
      therapist_id: drSharma._id,
      package_id: pkg6._id,
      packageName: pkg6.name,
      totalSessions: 6,
      usedSessions: 4,
      remainingSessions: 2,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    // 7. Seed Sessions (Past, Upcoming, No-show for analytics pipeline)
    console.log('[Seed] Seeding Sessions...');
    const sessionPast1 = await Session.create({
      therapist_id: drSharma._id,
      client_id: clientAarav._id,
      clientName: clientAarav.name,
      clientEmail: clientAarav.email,
      startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'completed',
      type: 'individual',
      fee: 1800,
    });

    const sessionPast2 = await Session.create({
      therapist_id: drSharma._id,
      client_id: clientAnanya._id,
      clientName: clientAnanya.name,
      clientEmail: clientAnanya.email,
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'completed',
      type: 'individual',
      fee: 1800,
    });

    const sessionNoShow = await Session.create({
      therapist_id: drSharma._id,
      client_id: clientVikram._id,
      clientName: clientVikram.name,
      clientEmail: clientVikram.email,
      startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'no-show',
      type: 'individual',
      fee: 1800,
    });

    const sessionUpcoming1 = await Session.create({
      therapist_id: drSharma._id,
      client_id: clientAarav._id,
      clientName: clientAarav.name,
      clientEmail: clientAarav.email,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 days ahead 11:00 AM
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'confirmed',
      type: 'individual',
      fee: 1800,
      meetingLink: 'https://meet.google.com/unfazed-dr-sharma-aarav',
    });

    const sessionUpcoming2 = await Session.create({
      therapist_id: drSharma._id,
      client_id: clientAnanya._id,
      clientName: clientAnanya.name,
      clientEmail: clientAnanya.email,
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'confirmed',
      type: 'individual',
      fee: 1800,
      meetingLink: 'https://meet.google.com/unfazed-dr-sharma-ananya',
    });

    // 8. Seed Clinical Documentation (Private vs Shared notes demonstrating role restriction)
    console.log('[Seed] Seeding Clinical Notes (Private SOAP & Shared client reflection)...');
    // Private SOAP note for Aarav (Strictly confidential)
    await SessionNote.create({
      session_id: sessionPast1._id,
      therapist_id: drSharma._id,
      client_id: clientAarav._id,
      type: 'private',
      template: 'soap',
      title: 'Clinical SOAP Note - Session 3',
      content: '<p>Client presented with moderate anxiety regarding upcoming board presentation.</p>',
      structuredFields: {
        subjective: 'Client reports sleep latency >45 min due to racing thoughts. Rated anxiety 7/10 regarding Friday engineering demo.',
        objective: 'Affect congruent, slightly restless. Speech clear. Responsive to box breathing demonstration.',
        assessment: 'Generalized performance anxiety with somatic manifestations. Cognitive distortions identified: Catastrophizing and mind-reading.',
        plan: '1. Assigned thought record log for catastrophic automatic thoughts. 2. Practice 4-7-8 breathing twice daily. 3. Review exposure hierarchy next Tuesday.',
      },
    });

    // Shared note for Aarav (Client portal visible)
    await SessionNote.create({
      session_id: sessionPast1._id,
      therapist_id: drSharma._id,
      client_id: clientAarav._id,
      type: 'shared',
      template: 'freeform',
      title: 'Takeaway Reflections & Grounding Exercises',
      content: '<p><strong>Hi Aarav,</strong></p><p>Here are your key reflection anchors from our session today:</p><ul><li><strong>Box Breathing (4-4-4-4):</strong> Inhale 4s, Hold 4s, Exhale 4s, Hold 4s before meetings.</li><li><strong>Thought Inquiry:</strong> When the thought <em>"I will freeze up"</em> occurs, ask: <em>"What is the realistic worst-case, and what evidence do I have that I can handle it?"</em></li><li>Take gentle care and see you next Tuesday!</li></ul>',
      sharedWithClientAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    });

    // 9. Seed Payments with GST Invoices
    console.log('[Seed] Seeding Payments & Invoices...');
    const payment1 = await Payment.create({
      therapist_id: drSharma._id,
      client_id: clientAarav._id,
      session_id: sessionPast1._id,
      itemType: 'session',
      itemDescription: 'Psychological Consultation & Individual Therapy Session',
      amount: 1800,
      currency: 'INR',
      status: 'paid',
      gateway: 'razorpay',
      gateway_order_id: 'order_test_98124',
      gateway_payment_id: 'pay_test_7718293',
      invoiceNumber: 'UFZ-2026-1042',
      clientName: clientAarav.name,
      clientEmail: clientAarav.email,
      paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      platform_fee: 36,
      net_amount: 1764,
    });

    const payment2 = await Payment.create({
      therapist_id: drSharma._id,
      client_id: clientAnanya._id,
      session_id: sessionPast2._id,
      itemType: 'session',
      itemDescription: 'EMDR Trauma Therapy Consultation',
      amount: 1800,
      currency: 'INR',
      status: 'paid',
      gateway: 'razorpay',
      gateway_order_id: 'order_test_98125',
      gateway_payment_id: 'pay_test_7718294',
      invoiceNumber: 'UFZ-2026-1043',
      clientName: clientAnanya.name,
      clientEmail: clientAnanya.email,
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      platform_fee: 36,
      net_amount: 1764,
    });

    const payment3 = await Payment.create({
      therapist_id: drSharma._id,
      client_id: clientAarav._id,
      package_id: pkg6._id,
      itemType: 'package',
      itemDescription: 'Deep Healing Journey (6 Sessions Package)',
      amount: 9000,
      currency: 'INR',
      status: 'paid',
      gateway: 'razorpay',
      gateway_order_id: 'order_test_98126',
      gateway_payment_id: 'pay_test_7718295',
      invoiceNumber: 'UFZ-2026-1044',
      clientName: clientAarav.name,
      clientEmail: clientAarav.email,
      paidAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      platform_fee: 180,
      net_amount: 8820,
    });

    // 10. Seed Incoming Lead
    console.log('[Seed] Seeding Leads...');
    await Lead.create({
      therapist_id: drSharma._id,
      name: 'Sneha Roy',
      email: 'sneha.roy@example.com',
      phone: '+91 98888 11223',
      presentingConcern: 'Seeking support for chronic insomnia and relationship anxiety.',
      notes: 'Prefers evening consultation slots.',
      source: 'branded_profile',
      status: 'new',
    });

    console.log('\n=============================================================');
    console.log('✅ Unfazed Database Seeded Successfully!');
    console.log('-------------------------------------------------------------');
    console.log('Demo Therapist 1:');
    console.log('  Email:    dr.sharma@unfazed.in');
    console.log('  Password: password123');
    console.log('  Slug:     /dr-sharma');
    console.log('  Tier:     growth (SOAP & Packages unlocked)');
    console.log('\nDemo Therapist 2:');
    console.log('  Email:    dr.verma@unfazed.in');
    console.log('  Password: password123');
    console.log('  Slug:     /rohan-verma');
    console.log('  Tier:     starter (demonstrates Upgrade Prompt gating)');
    console.log('\nDemo Client:');
    console.log('  Email:    aarav.mehta@example.com');
    console.log('  Password: (Uses Quick Client Login in Portal)');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
