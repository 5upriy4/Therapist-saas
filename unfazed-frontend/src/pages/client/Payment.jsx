import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getBaseURL } from '../../api/axiosInstance';
import { CreditCard, Download, ShieldCheck, ArrowLeft } from 'lucide-react';

const Payment = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      try {
        await api.get(`/payments/invoice/${id}`);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPayment();
  }, [id]);

  const invoiceDownloadUrl = `${getBaseURL()}/payments/invoice/${id}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm shadow-blue-500/20">
        <CreditCard className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tax Invoice Download</h2>
        <p className="text-xs text-slate-500">
          GST-compliant computerized medical tax invoice issued under Rule 46 of CGST Rules, 2017.
        </p>
      </div>

      <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <a
          href={invoiceDownloadUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-blue-500/25 transition-all text-sm"
        >
          <Download className="w-5 h-5" />
          <span>Download Formal PDF Invoice</span>
        </a>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Verified GSTIN & SAC Code 999312</span>
        </div>
      </div>

      <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Practice Profile</span>
      </Link>
    </div>
  );
};

export default Payment;
