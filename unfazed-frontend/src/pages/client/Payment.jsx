import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { CreditCard, Download, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

const Payment = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/payments/invoice/${id}`);
        // If buffer returned or json
        setPayment(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPayment();
  }, [id]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto">
        <CreditCard className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Tax Invoice Download</h2>
        <p className="text-xs text-slate-500">
          GST-compliant computerized medical tax invoice issued under Rule 46 of CGST Rules, 2017.
        </p>
      </div>

      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <a
          href={`http://localhost:5000/api/payments/invoice/${id}`}
          target="_blank"
          rel="noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm"
        >
          <Download className="w-5 h-5" />
          <span>Download Formal PDF Invoice</span>
        </a>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified GSTIN & SAC Code 999312</span>
        </div>
      </div>

      <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};

export default Payment;
