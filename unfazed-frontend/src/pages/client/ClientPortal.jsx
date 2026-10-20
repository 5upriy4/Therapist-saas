import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from '../../components/chat/ChatWindow';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import {
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  Video,
  Download,
  Lock,
  Share2,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientPortal = () => {
  const { user, loginClient, isClient } = useAuth();
  const [emailInput, setEmailInput] = useState('aarav.mehta@example.com');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'notes' | 'invoices' | 'chat'

  const fetchPortalData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/clients/portal/me');
      if (res.data?.success) {
        setPortalData(res.data);
      }
    } catch (err) {
      console.warn('Could not load portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchPortalData();
    }
  }, [isClient]);

  const handleClientLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginClient(emailInput, 'dr-sharma');
      await fetchPortalData();
    } catch (err) {
      setError(err.message || 'Client account lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated as client, show Quick Client Login / Email Verification screen
  if (!isClient || !portalData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center font-bold text-xl mx-auto">
            U
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Client Care Portal</h2>
          <p className="text-xs text-slate-500">
            Access your upcoming therapy sessions, homework reflections, and tax invoices.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleClientLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. aarav.mehta@example.com"
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <Button variant="primary" type="submit" loading={loading} className="w-full shadow-md">
              Access My Portal
            </Button>
          </form>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold block text-slate-800">Demo Testing Helper:</span>
            <p>
              Use demo client email: <code className="text-teal-700 font-mono font-bold">aarav.mehta@example.com</code> or book a new session via the branded profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { client, sessions, sharedNotes, payments } = portalData;
  const therapist = client.therapist_id || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Portal Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl">
            {client.name.charAt(0)}
          </div>
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Confidential Client Portal
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
            <p className="text-xs text-slate-500">
              Primary Therapist: <span className="font-semibold text-slate-700">{therapist.name}</span> ({therapist.title})
            </p>
          </div>
        </div>

        <Link to={`/${therapist.slug || 'dr-sharma'}`}>
          <Button variant="outline" size="sm">
            Book Another Session
          </Button>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 text-xs sm:text-sm font-semibold">
        {[
          { key: 'sessions', label: `Appointments (${sessions?.length || 0})`, icon: Calendar },
          { key: 'notes', label: `Shared Homework & Notes (${sharedNotes?.length || 0})`, icon: Share2 },
          { key: 'invoices', label: `Invoices & Receipts (${payments?.length || 0})`, icon: CreditCard },
          { key: 'chat', label: 'Message Therapist', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 pb-3 px-3 transition-colors ${
                isActive
                  ? 'border-b-2 border-teal-600 text-teal-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions?.length > 0 ? (
            sessions.map((sess) => (
              <div
                key={sess._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-slate-900">
                      {new Date(sess.startTime).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        sess.status === 'confirmed'
                          ? 'bg-blue-50 text-blue-700'
                          : sess.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sess.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Time:{' '}
                    <span className="font-semibold text-slate-700">
                      {new Date(sess.startTime).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>{' '}
                    • {sess.duration} mins • {sess.type} therapy
                  </p>
                </div>

                {sess.meetingLink && sess.status === 'confirmed' && (
                  <a
                    href={sess.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Video Call</span>
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No sessions scheduled.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Shared Clinical Notes (Strict Security: Private Notes excluded) */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-start gap-2">
            <Share2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Shared Clinical Anchors:</span> These reflections and action items were shared specifically by your therapist for review between sessions. Confidential clinical internal diagnostics remain strictly private.
            </div>
          </div>

          {sharedNotes?.length > 0 ? (
            sharedNotes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">{note.title}</h4>
                  <span className="text-xs text-slate-400">
                    Shared on {new Date(note.sharedWithClientAt || note.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div
                  className="text-xs sm:text-sm text-slate-700 leading-relaxed prose prose-teal"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No notes have been shared by your therapist yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: GST Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {payments?.length > 0 ? (
            payments.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">₹{p.amount}</span>
                    <span className="text-slate-500 font-mono">#{p.invoiceNumber}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {p.itemDescription} • {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <a
                  href={`http://localhost:5000/api/payments/invoice/${p._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>GST Invoice PDF</span>
                </a>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No payments recorded.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Live Chat */}
      {activeTab === 'chat' && (
        <ChatWindow
          currentUser={{ id: client._id, name: client.name, role: 'client' }}
          partnerUser={{ id: therapist._id, name: therapist.name, role: 'therapist' }}
          roomName={`chat_${therapist._id}_${client._id}`}
        />
      )}
    </div>
  );
};

export default ClientPortal;
