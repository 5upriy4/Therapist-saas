import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import useEntitlement from '../../hooks/useEntitlement';
import ClientTable from '../../components/crm/ClientTable';
import ClientDetailModal from '../../components/crm/ClientDetailModal';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ChatWindow from '../../components/chat/ChatWindow';
import NoteEditor from '../../components/notes/NoteEditor';
import UpgradePromptModal from '../../components/common/UpgradePromptModal';
import { Users, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Clients = () => {
  const { user } = useAuth();
  const {
    activeClientsCount,
    maxActiveClients,
    canAddMoreClients,
    openUpgradeModal,
    upgradeModalState,
    closeUpgradeModal,
    upgradeTier,
    refreshEntitlements,
  } = useEntitlement();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    tags: 'individual, cbt',
  });
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      if (res.data?.success) {
        setClients(res.data.clients || []);
      }
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenAddClient = () => {
    // Entitlement Check: ACTIVE_CLIENTS limit
    if (!canAddMoreClients()) {
      openUpgradeModal(
        'ACTIVE_CLIENTS',
        `You have reached the maximum active caseload cap of ${maxActiveClients} clients allowed on your current tier. Upgrade to add more clients.`
      );
      return;
    }
    setAddError('');
    setAddModalOpen(true);
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      const tagArray = newClient.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await api.post('/clients', {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        tags: tagArray,
      });

      if (res.data?.success) {
        setAddModalOpen(false);
        setNewClient({ name: '', email: '', phone: '', tags: 'individual, cbt' });
        await fetchClients();
        await refreshEntitlements();
      }
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add client');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <Loader text="Loading client practice records..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Caseload limit indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Client Caseload Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track client journeys, auditable digital consent timestamps, and clinical histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active client quota badge */}
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
            Caseload:{' '}
            <span className="text-blue-700 font-bold">
              {activeClientsCount} / {maxActiveClients === 999999 ? 'Unlimited' : maxActiveClients}
            </span>
          </div>

          <Button variant="primary" icon={UserPlus} onClick={handleOpenAddClient}>
            Add Client
          </Button>
        </div>
      </div>

      {/* Client Table */}
      <ClientTable
        clients={clients}
        onSelectClient={(c) => {
          setSelectedClient(c);
          setDetailModalOpen(true);
        }}
        onStartNote={(c) => {
          setSelectedClient(c);
          setNoteModalOpen(true);
        }}
        onChatClient={(c) => {
          setSelectedClient(c);
          setChatModalOpen(true);
        }}
      />

      {/* Add Client Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Practice Client"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          {addError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              placeholder="e.g. Vikram Sengupta"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              placeholder="vikram@example.com"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              placeholder="+91 98300 45678"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={newClient.tags}
              onChange={(e) => setNewClient({ ...newClient, tags: e.target.value })}
              placeholder="anxiety, weekly, cbt"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={adding}>
              Confirm & Create Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        clientId={selectedClient?._id}
        onOpenNoteEditor={(c) => {
          setSelectedClient(c);
          setNoteModalOpen(true);
        }}
      />

      {/* Note Editor Modal */}
      {noteModalOpen && (
        <Modal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          title="Clinical Documentation"
          maxWidth="max-w-3xl"
        >
          <NoteEditor
            client={selectedClient}
            session={{ _id: selectedClient?._id, startTime: new Date() }}
            onSaved={() => {
              setNoteModalOpen(false);
              fetchClients();
            }}
            onCancel={() => setNoteModalOpen(false)}
          />
        </Modal>
      )}

      {/* Real-time Chat Drawer Modal */}
      {chatModalOpen && (
        <Modal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          title={`Confidential Chat with ${selectedClient?.name}`}
          maxWidth="max-w-xl"
        >
          <ChatWindow
            currentUser={{ id: user?.id, name: user?.name, role: 'therapist' }}
            partnerUser={{ id: selectedClient?._id, name: selectedClient?.name, role: 'client' }}
            roomName={`chat_${user?.id}_${selectedClient?._id}`}
          />
        </Modal>
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={upgradeModalState.isOpen}
        onClose={closeUpgradeModal}
        featureKey={upgradeModalState.featureKey}
        reason={upgradeModalState.reason}
        onUpgradeSuccess={upgradeTier}
      />
    </div>
  );
};

export default Clients;
