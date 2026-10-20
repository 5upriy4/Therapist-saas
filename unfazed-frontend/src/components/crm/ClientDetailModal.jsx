import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Loader from '../common/Loader';
import api from '../../api/axiosInstance';
import {
  User,
  Calendar,
  CreditCard,
  FileText,
  ShieldCheck,
  Tag,
  Clock,
  Download,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';

const ClientDetailModal = ({ isOpen, onClose, clientId, onOpenNoteEditor }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sessions' | 'notes' | 'payments' | 'intake'

  useEffect(() => {
    const fetchClientRecord = async () => {
      if (!clientId) return;
      setLoading(true);
      try {
        const res = await api.get(`/clients/${clientId}`);
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load client profile', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && clientId) {
      fetchClientRecord();
    }
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Client Clinical Profile" maxWidth="max-w-4xl">
      {loading ? (
        <Loader text="Aggregating sessions, billing & clinical notes..." />
      ) : !data?.client ? (
        <div className="p-6 text-center text-xs text-rose-500">Record could not be retrieved.</div>
      ) : (
        <div className="space-y-6">
          {/* Top Client Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
                {data.client.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg leading-tight">
                  {data.client.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {data.client.email}
                  </span>
                  {data.client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {data.client.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase bg-teal-100 text-teal-800">
                {data.client.status}
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={FileText}
                onClick={() => {
                  onClose();
                  if (onOpenNoteEditor) onOpenNoteEditor(data.client);
                }}
              >
                Write Note
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-200 text-xs font-semibold">
            {[
              { key: 'overview', label: 'Intake & Consent' },
              { key: 'sessions', label: `Sessions (${data.sessions?.length || 0})` },
              { key: 'notes', label: `Clinical Notes (${data.notes?.length || 0})` },
              { key: 'payments', label: `Billing & Invoices (${data.payments?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-2.5 px-3 transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-teal-600 text-teal-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[260px]">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Digital Consent Audit Record */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      Auditable Telehealth Consent
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-semibold">
                      VERIFIED & TIMESTAMPED
                    </span>
                  </div>
                  {data.client.consent?.agreed ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-emerald-900">
                      <div>
                        <span className="text-emerald-700 font-medium block">Timestamp:</span>
                        <span>{new Date(data.client.consent.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 font-medium block">Consent Version:</span>
                        <span>{data.client.consent.consentVersion}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 font-medium block">IP Reference:</span>
                        <span>{data.client.consent.ipAddress}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Consent pending or not yet submitted.</p>
                  )}
                </div>

                {/* Intake Form Record */}
                {data.client.intakeForm ? (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-xs">
                    <h5 className="font-bold text-slate-900 text-sm">Initial Clinical Intake</h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-medium">Presenting Concern</span>
                        <p className="text-slate-800 font-medium mt-0.5">
                          {data.client.intakeForm.presentingConcern || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Therapy Goals</span>
                        <p className="text-slate-800 font-medium mt-0.5">
                          {data.client.intakeForm.goals || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block font-medium">Medical History</span>
                        <p className="text-slate-700 mt-0.5">
                          {data.client.intakeForm.medicalHistory || 'None reported'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Mental Health History</span>
                        <p className="text-slate-700 mt-0.5">
                          {data.client.intakeForm.mentalHealthHistory || 'None reported'}
                        </p>
                      </div>
                    </div>

                    {data.client.intakeForm.demographics && (
                      <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap gap-4">
                        <span>Age: {data.client.intakeForm.demographics.age || 'N/A'}</span>
                        <span>Occupation: {data.client.intakeForm.demographics.occupation || 'N/A'}</span>
                        <span>Emergency: {data.client.intakeForm.demographics.emergencyContactName} ({data.client.intakeForm.demographics.emergencyContactPhone})</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No intake form submitted by client yet.
                  </div>
                )}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="space-y-2">
                {data.sessions?.length > 0 ? (
                  data.sessions.map((sess) => (
                    <div
                      key={sess._id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {new Date(sess.startTime).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(sess.startTime).toLocaleTimeString('en-IN', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Duration: {sess.duration}m | Type: {sess.type} | Fee: ₹{sess.fee}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                          sess.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sess.status === 'no-show'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No session history found.</p>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                {data.notes?.length > 0 ? (
                  data.notes.map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 rounded-xl border text-xs ${
                        n.type === 'private'
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-teal-50/30 border-teal-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              n.type === 'private'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {n.type === 'private' ? 'Confidential Private' : 'Shared with Client'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Render SOAP fields if present */}
                      {n.template === 'soap' && n.structuredFields ? (
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          <div>
                            <span className="font-bold text-slate-700">Subjective: </span>
                            <span className="text-slate-600">{n.structuredFields.subjective}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Objective: </span>
                            <span className="text-slate-600">{n.structuredFields.objective}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Assessment: </span>
                            <span className="text-slate-600">{n.structuredFields.assessment}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Plan: </span>
                            <span className="text-slate-600">{n.structuredFields.plan}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="text-slate-700 prose prose-xs"
                          dangerouslySetInnerHTML={{ __html: n.content }}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No clinical notes recorded yet for this client.
                  </p>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-2">
                {data.payments?.length > 0 ? (
                  data.payments.map((p) => (
                    <div
                      key={p._id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">₹{p.amount}</span>
                          <span className="text-slate-500">#{p.invoiceNumber || 'INV-Pending'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.itemDescription} • {new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 uppercase">
                          {p.status}
                        </span>
                        <a
                          href={`http://localhost:5000/api/payments/invoice/${p._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-teal-700 hover:bg-teal-50 rounded"
                          title="Download GST Tax Invoice PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No payments recorded.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ClientDetailModal;
