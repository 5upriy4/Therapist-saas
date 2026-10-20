import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import api from '../../api/axiosInstance';
import { CreditCard, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

const CheckoutForm = ({ isOpen, onClose, therapist, item, itemType = 'session', onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const amount = item?.price || therapist?.sessionFee || 1500;

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create order on backend
      const orderRes = await api.post('/payments/create-order', {
        therapistId: therapist.id || therapist._id,
        amount,
        itemType,
        itemDescription: item?.name || `${therapist.sessionDuration || 50}-Minute Therapy Consultation`,
        packageId: itemType === 'package' ? item._id : undefined,
        clientName: clientDetails.name,
        clientEmail: clientDetails.email,
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.error || 'Order creation failed');
      }

      const { orderId, amount: amountPaise, paymentId } = orderRes.data;

      // 2. Check if Razorpay JS SDK is loaded on window
      if (window.Razorpay && !orderId.startsWith('order_sim_')) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_unfazed_demo_key',
          amount: amountPaise,
          currency: 'INR',
          name: therapist.name,
          description: item?.name || 'Therapy Consultation',
          order_id: orderId,
          handler: async (response) => {
            // Verify payment
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentRecordId: paymentId,
            });

            if (onPaymentSuccess) {
              onPaymentSuccess(verifyRes.data?.payment);
            }
            onClose();
          },
          prefill: {
            name: clientDetails.name,
            email: clientDetails.email,
            contact: clientDetails.phone,
          },
          theme: { color: '#0d9488' },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Simulated / Sandbox fallback mode for testing without real keys
        const verifyRes = await api.post('/payments/verify', {
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'sandbox_test_signature',
          paymentRecordId: paymentId,
        });

        if (onPaymentSuccess) {
          onPaymentSuccess(verifyRes.data?.payment);
        }
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Checkout & Confirmation" maxWidth="max-w-md">
      <form onSubmit={handlePay} className="space-y-4">
        {/* Item Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                {itemType === 'package' ? 'Session Package' : 'Individual Consultation'}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                {item?.name || '50-Min Psychological Consultation'}
              </h4>
              <p className="text-xs text-slate-500">Therapist: {therapist?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-slate-900">₹{amount}</span>
              <span className="text-[10px] text-slate-400 block">GST Inclusive</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
          <input
            type="text"
            required
            value={clientDetails.name}
            onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
            placeholder="e.g. Aarav Mehta"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={clientDetails.email}
              onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
              placeholder="aarav@example.com"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              value={clientDetails.phone}
              onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
              placeholder="+91 98200 11223"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            type="submit"
            size="lg"
            className="w-full shadow-md"
            loading={loading}
            icon={CreditCard}
          >
            Pay ₹{amount} (Razorpay Sandbox / Live)
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>GST Tax Invoice automatically generated upon completion</span>
        </div>
      </form>
    </Modal>
  );
};

export default CheckoutForm;
