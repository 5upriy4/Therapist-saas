import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Hero from '../../components/profile/Hero';
import About from '../../components/profile/About';
import ServiceCard from '../../components/profile/ServiceCard';
import SlotPicker from '../../components/scheduling/SlotPicker';
import LeadModal from '../../components/profile/LeadModal';
import CheckoutForm from '../../components/payments/CheckoutForm';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Video,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

const DEFAULT_DEMO_THERAPIST = {
  success: true,
  therapist: {
    id: '6ad7517dd3ddcb0ce1b88c83',
    name: 'Dr. Priya Sharma',
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
      website: '',
    },
  },
  packages: [
    {
      _id: '6ad7517ed3ddcb0ce1b88c87',
      therapist_id: '6ad7517dd3ddcb0ce1b88c83',
      name: 'Anxiety Reset Package (3 Sessions)',
      sessionCount: 3,
      price: 4800,
      perSessionRate: 1600,
      validityDays: 60,
      description: 'Focused 3-session intervention covering anxiety triggers, somatic grounding, and cognitive reframing.',
      savingsPercentage: 11,
      isActive: true,
    },
    {
      _id: '6ad7517ed3ddcb0ce1b88c88',
      therapist_id: '6ad7517dd3ddcb0ce1b88c83',
      name: 'Deep Healing Journey (6 Sessions)',
      sessionCount: 6,
      price: 9000,
      perSessionRate: 1500,
      validityDays: 120,
      description: 'Comprehensive 6-session therapeutic arc for deep trauma processing, coping mechanism rebuilding, and relapse prevention.',
      savingsPercentage: 17,
      isActive: true,
    },
  ],
  availability: {
    timezone: 'Asia/Kolkata',
    slotDurations: [30, 45, 50, 60],
    defaultDuration: 50,
  },
};

const BookingPage = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');

  // Modals
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceType, setServiceType] = useState('session');

  // Booking Flow Steps: 1: Slot Selection, 2: Intake & Consent, 3: Confirmation
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedSlotData, setSelectedSlotData] = useState(null);

  // Client Intake & Consent Form State
  const [intake, setIntake] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'female',
    presentingConcern: '',
    medicalHistory: '',
    mentalHealthHistory: '',
    goals: '',
    consentAgreed: false,
  });

  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const fetchPublicProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const targetSlug = slug || 'dr-sharma';
        const res = await api.get(`/therapist/public/${targetSlug}`);
        if (res.data?.success) {
          setProfileData(res.data);
          // Set page title for Open Graph
          document.title = `${res.data.therapist.name} | Unfazed`;
        }
      } catch (err) {
        if (!slug || slug === 'dr-sharma') {
          console.warn('[Unfazed] Using resilient demo practitioner profile for Dr. Priya Sharma');
          setProfileData(DEFAULT_DEMO_THERAPIST);
          document.title = 'Dr. Priya Sharma | Unfazed';
        } else {
          setError(err.response?.data?.error || 'Therapist profile could not be found.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [slug]);

  const handleSlotSelect = (slotData) => {
    setSelectedSlotData(slotData);
    setBookingStep(2); // Proceed to Intake & Digital Consent step
    // Smooth scroll to intake form
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!intake.consentAgreed) {
      setBookingError('You must provide digital telehealth consent before booking.');
      return;
    }
    setBookingError('');
    setBookingInProgress(true);

    try {
      // 1. Double-booking prevented atomic slot booking
      const bookRes = await api.post('/scheduling/book-slot', {
        therapistId: profileData.therapist.id,
        therapistSlug: profileData.therapist.slug,
        clientName: intake.name,
        clientEmail: intake.email,
        clientPhone: intake.phone,
        startTime: selectedSlotData.startTime,
        duration: selectedSlotData.duration || 50,
        type: 'individual',
        notes: intake.presentingConcern,
      });

      if (!bookRes.data?.success) {
        throw new Error(bookRes.data?.error || 'Slot booking failed');
      }

      const { session, client } = bookRes.data;

      // 2. Submit Intake & Auditable Consent record
      await api.post('/clients/intake-and-consent', {
        clientId: client.id,
        demographics: {
          age: Number(intake.age) || undefined,
          gender: intake.gender,
        },
        presentingConcern: intake.presentingConcern,
        medicalHistory: intake.medicalHistory,
        mentalHealthHistory: intake.mentalHealthHistory,
        goals: intake.goals,
        consentAgreed: true,
      });

      // 3. Initiate payment simulation / checkout
      const payRes = await api.post('/payments/create-order', {
        therapistId: profileData.therapist.id,
        clientId: client.id,
        sessionId: session._id,
        amount: profileData.therapist.sessionFee || 1500,
        clientName: client.name,
        clientEmail: client.email,
        itemType: 'session',
      });

      // Verify payment (auto-confirm in test/sandbox mode)
      const verifyRes = await api.post('/payments/verify', {
        razorpay_order_id: payRes.data?.orderId,
        razorpay_payment_id: `pay_auto_${Date.now()}`,
        paymentRecordId: payRes.data?.paymentId,
      });

      setConfirmedBooking({
        session,
        client,
        payment: verifyRes.data?.payment,
        invoiceNumber: verifyRes.data?.invoiceNumber,
      });

      setBookingStep(3); // Confirmation step
    } catch (err) {
      setBookingError(err.response?.data?.error || err.message || 'Booking failed.');
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return <Loader text="Loading therapist profile..." />;
  }

  if (error || !profileData?.therapist) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Therapist Profile Not Found</h3>
        <p className="text-xs text-slate-500">
          The link you accessed does not correspond to an active therapist practice.
        </p>
        <Link to="/dr-sharma">
          <Button variant="primary" size="sm">
            Visit Demo Profile (Dr. Priya Sharma)
          </Button>
        </Link>
      </div>
    );
  }

  const { therapist, packages } = profileData;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Branded Profile Hero */}
      <Hero
        therapist={therapist}
        onBookClick={() => {
          document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onInquireClick={() => setLeadModalOpen(true)}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* About & Credentials */}
        <About therapist={therapist} />

        {/* Multi-Session Packages & Services */}
        {packages?.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Multi-Session Therapeutic Bundles
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Discounted packages for long-term emotional restructuring & consistency
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <ServiceCard
                  key={pkg._id}
                  item={pkg}
                  type="package"
                  onSelect={(item) => {
                    setSelectedService(item);
                    setServiceType('package');
                    setCheckoutModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Booking & Scheduling Interactive Section */}
        <div id="booking-section" className="pt-6 border-t border-slate-200 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Schedule Your Consultation
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Select an available time slot below to secure your appointment.
            </p>
          </div>

          {/* Step 1: Slot Picker */}
          {bookingStep === 1 && (
            <SlotPicker
              therapistId={therapist.id}
              therapistSlug={therapist.slug}
              onSlotSelect={handleSlotSelect}
              onJoinWaitlist={() => setLeadModalOpen(true)}
            />
          )}

          {/* Step 2: Intake Form & Digital Consent */}
          {bookingStep === 2 && selectedSlotData && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Step 2 of 2
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">
                    Client Details, Intake & Telehealth Consent
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200/60 px-3 py-1.5 rounded-xl shadow-2xs">
                    {new Date(selectedSlotData.startTime).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: selectedSlotData.timezone,
                    })}{' '}
                    on {new Date(selectedSlotData.startTime).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <form onSubmit={handleIntakeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={intake.name}
                      onChange={(e) => setIntake({ ...intake, name: e.target.value })}
                      placeholder="e.g. Aarav Mehta"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={intake.email}
                      onChange={(e) => setIntake({ ...intake, email: e.target.value })}
                      placeholder="aarav@example.com"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={intake.phone}
                      onChange={(e) => setIntake({ ...intake, phone: e.target.value })}
                      placeholder="+91 98200 11223"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={intake.age}
                      onChange={(e) => setIntake({ ...intake, age: e.target.value })}
                      placeholder="e.g. 29"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={intake.gender}
                      onChange={(e) => setIntake({ ...intake, gender: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Presenting Concern / Reason for Seeking Therapy *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={intake.presentingConcern}
                    onChange={(e) => setIntake({ ...intake, presentingConcern: e.target.value })}
                    placeholder="Briefly describe the challenges, anxiety triggers, or goals you wish to address..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Digital Telehealth Consent Capture (Auditable Record) */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    Telehealth Informed Consent & Medical Confidentiality
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    By checking the box below, I consent to participate in tele-psychology consultations via encrypted video connection. I understand that my clinical notes and medical records are confidential under the Mental Healthcare Act, 2017. An auditable timestamp and IP address record will be stored with this booking.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="consentCheck"
                      checked={intake.consentAgreed}
                      onChange={(e) => setIntake({ ...intake, consentAgreed: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="consentCheck" className="text-xs font-bold text-slate-900 cursor-pointer">
                      I agree to the Informed Telehealth Consent and Terms of Practice *
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setBookingStep(1)}
                    disabled={bookingInProgress}
                  >
                    ← Choose Different Slot
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    loading={bookingInProgress}
                    disabled={!intake.consentAgreed}
                  >
                    Confirm Booking & Pay ₹{therapist.sessionFee || 1500}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Instant Confirmation Screen */}
          {bookingStep === 3 && confirmedBooking && (
            <div className="bg-white rounded-3xl border border-blue-200/90 p-8 sm:p-10 shadow-xl shadow-blue-900/5 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full shadow-2xs">
                  Appointment Confirmed
                </span>
                <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  You're all set, {confirmedBooking.client.name}!
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                  Your session with {therapist.name} has been booked. Confirmation notifications have been dispatched to your email & WhatsApp.
                </p>
              </div>

              {/* Booking Details Card */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 max-w-lg mx-auto text-left space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(confirmedBooking.session.startTime).toLocaleString('en-IN', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Duration & Format:</span>
                  <span className="font-bold text-slate-900">
                    {confirmedBooking.session.duration} Minutes • 1-on-1 Secure Video
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Tax Invoice Number:</span>
                  <span className="font-bold text-blue-700">
                    #{confirmedBooking.invoiceNumber || 'INV-Generated'}
                  </span>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <span className="text-slate-500">Video Call Link:</span>
                  <a
                    href={confirmedBooking.session.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 p-2.5 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>{confirmedBooking.session.meetingLink}</span>
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/portal"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition-all"
                >
                  <span>Go to Client Portal</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inquiry Lead Modal */}
      <LeadModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        therapistId={therapist.id}
        therapistName={therapist.name}
      />

      {/* Package Checkout Modal */}
      {selectedService && (
        <CheckoutForm
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          therapist={therapist}
          item={selectedService}
          itemType={serviceType}
          onPaymentSuccess={(pmt) => {
            alert(`Payment completed! Invoice #${pmt?.invoiceNumber} generated.`);
          }}
        />
      )}
    </div>
  );
};

export default BookingPage;
