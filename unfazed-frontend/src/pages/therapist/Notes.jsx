import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import NoteEditor from '../../components/notes/NoteEditor';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import UpgradePromptModal from '../../components/common/UpgradePromptModal';
import useEntitlement from '../../hooks/useEntitlement';
import { FileText, Plus, Lock, Share2, Tag, Trash2, Calendar, User, Search } from 'lucide-react';

const Notes = () => {
  const { upgradeModalState, closeUpgradeModal, upgradeTier } = useEntitlement();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'private' | 'shared'
  const [loading, setLoading] = useState(true);

  // Notes collected from all clients or loaded for active clients
  const [notesList, setNotesList] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      if (res.data?.success) {
        setClients(res.data.clients || []);
        if (res.data.clients?.length > 0) {
          setSelectedClient(res.data.clients[0]);
          // Load details of first client to get initial notes
          const firstDetail = await api.get(`/clients/${res.data.clients[0]._id}`);
          if (firstDetail.data?.success) {
            setNotesList(firstDetail.data.notes || []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load notes data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectClient = async (c) => {
    setSelectedClient(c);
    try {
      const detail = await api.get(`/clients/${c._id}`);
      if (detail.data?.success) {
        setNotesList(detail.data.notes || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this clinical note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotesList((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  const filteredNotes = notesList.filter((n) => {
    const matchType = filterType === 'all' || n.type === filterType;
    const matchSearch =
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  if (loading) {
    return <Loader text="Loading clinical documentation records..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            <span>Clinical Documentation Suite</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain strict HIPAA & Indian Mental Health Act compliant documentation with SOAP / DAP templates and role-based client reflection sharing.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingNote(null);
            setEditorOpen(true);
          }}
          disabled={!selectedClient}
        >
          New Clinical Note
        </Button>
      </div>

      {/* Main Two-Column Layout: Client Selector + Notes Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Client List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Select Client</h4>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {clients.map((c) => {
              const isSelected = selectedClient?._id === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() => handleSelectClient(c)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-teal-50 text-teal-900 font-semibold border border-teal-200/80 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{c.email}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {c.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Clinical Notes for Selected Client */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls: Search & Filter Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search notes by keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Notes
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  filterType === 'private'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3 h-3" /> Private Notes
              </button>
              <button
                onClick={() => setFilterType('shared')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  filterType === 'shared'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Share2 className="w-3 h-3" /> Shared Reflections
              </button>
            </div>
          </div>

          {/* Notes Cards */}
          <div className="space-y-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div
                  key={note._id}
                  className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 transition-all ${
                    note.type === 'private'
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-teal-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{note.title}</h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          note.type === 'private'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {note.type === 'private' ? (
                          <>
                            <Lock className="w-3 h-3" /> Private (Therapist Only)
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3 h-3" /> Shared with Client
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(note.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Render SOAP fields if template is soap */}
                  {note.template === 'soap' && note.structuredFields ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs mb-0.5">
                          S — Subjective
                        </span>
                        <p className="text-slate-600">{note.structuredFields.subjective || 'None'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs mb-0.5">
                          O — Objective
                        </span>
                        <p className="text-slate-600">{note.structuredFields.objective || 'None'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs mb-0.5">
                          A — Assessment
                        </span>
                        <p className="text-slate-600">{note.structuredFields.assessment || 'None'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs mb-0.5">
                          P — Plan
                        </span>
                        <p className="text-slate-600">{note.structuredFields.plan || 'None'}</p>
                      </div>
                    </div>
                  ) : note.template === 'dap' && note.structuredFields ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block text-xs mb-0.5">D — Data</span>
                        <p className="text-slate-600">{note.structuredFields.data || 'None'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs mb-0.5">A — Assessment</span>
                        <p className="text-slate-600">{note.structuredFields.dapAssessment || 'None'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs mb-0.5">P — Plan</span>
                        <p className="text-slate-600">{note.structuredFields.dapPlan || 'None'}</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-xs sm:text-sm text-slate-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                No clinical notes found for this client. Click "New Clinical Note" above to write documentation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Editor Modal */}
      {editorOpen && (
        <Modal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title="Clinical Documentation Editor"
          maxWidth="max-w-3xl"
        >
          <NoteEditor
            client={selectedClient}
            session={{ _id: selectedClient?._id, startTime: new Date() }}
            initialNote={editingNote}
            onSaved={(savedNote) => {
              setEditorOpen(false);
              setNotesList((prev) => [savedNote, ...prev.filter((n) => n._id !== savedNote._id)]);
            }}
            onCancel={() => setEditorOpen(false)}
          />
        </Modal>
      )}

      {/* Upgrade Modal */}
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

export default Notes;
