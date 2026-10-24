import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { Lock, Share2, Sparkles, AlertCircle, Save, Check } from 'lucide-react';
import useEntitlement from '../../hooks/useEntitlement';
import api from '../../api/axiosInstance';

const NoteEditor = ({ session, client, initialNote, onSaved, onCancel }) => {
  const { canUseNoteTemplate, openUpgradeModal } = useEntitlement();

  const [type, setType] = useState(initialNote?.type || 'private'); // 'private' | 'shared'
  const [template, setTemplate] = useState(initialNote?.template || 'freeform'); // 'freeform' | 'soap' | 'dap'
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');

  // SOAP fields
  const [soapFields, setSoapFields] = useState({
    subjective: initialNote?.structuredFields?.subjective || '',
    objective: initialNote?.structuredFields?.objective || '',
    assessment: initialNote?.structuredFields?.assessment || '',
    plan: initialNote?.structuredFields?.plan || '',
  });

  // DAP fields
  const [dapFields, setDapFields] = useState({
    data: initialNote?.structuredFields?.data || '',
    dapAssessment: initialNote?.structuredFields?.dapAssessment || '',
    dapPlan: initialNote?.structuredFields?.dapPlan || '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Handle template switch with entitlement check
  const handleTemplateChange = (newTemplate) => {
    if (newTemplate !== 'freeform' && !canUseNoteTemplate(newTemplate)) {
      openUpgradeModal(
        'NOTE_TEMPLATE',
        `The structured '${newTemplate.toUpperCase()}' clinical template is an advanced feature reserved for Growth & Practice tiers.`
      );
      return;
    }
    setTemplate(newTemplate);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        noteId: initialNote?._id,
        sessionId: session?._id || initialNote?.session_id,
        clientId: client?._id || initialNote?.client_id,
        type,
        template,
        title: title || (type === 'private' ? 'Internal Clinical Assessment' : 'Shared Reflections & Takeaways'),
        content,
        structuredFields: template === 'soap' ? soapFields : template === 'dap' ? dapFields : null,
      };

      const res = await api.post('/notes', payload);
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSaved) onSaved(res.data.note);
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header with Title and Session Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {initialNote ? 'Edit Clinical Note' : 'Document Therapy Session'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Client: <span className="font-semibold text-slate-700">{client?.name}</span>
            {session && (
              <span>
                {' '}
                • {new Date(session.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </span>
            )}
          </p>
        </div>

        {/* Private vs Shared Role-Restricted Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('private')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              type === 'private'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Private (Therapist Only)</span>
          </button>
          <button
            type="button"
            onClick={() => setType('shared')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              type === 'shared'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Shared (Client Portal)</span>
          </button>
        </div>
      </div>

      {/* Security alert indicator */}
      {type === 'private' ? (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Strict Role Separation Active:</span> Private clinical notes are protected by the API serializer and are NEVER returned on any client portal endpoint.
          </div>
        </div>
      ) : (
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
          <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Client Visibility Notice:</span> This note will be visible to the client in their secure Unfazed portal as shared homework or reflections.
          </div>
        </div>
      )}

      {/* Template Format Selector (Gated by Entitlement) */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-700">Format:</span>
        <div className="flex gap-2">
          {[
            { key: 'freeform', label: 'Freeform Editor', gated: false },
            { key: 'soap', label: 'SOAP Template', gated: !canUseNoteTemplate('soap') },
            { key: 'dap', label: 'DAP Template', gated: !canUseNoteTemplate('dap') },
          ].map((fmt) => (
            <button
              key={fmt.key}
              type="button"
              onClick={() => handleTemplateChange(fmt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                template === fmt.key
                  ? 'border-blue-600 bg-blue-50 text-blue-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{fmt.label}</span>
              {fmt.gated && (
                <span className="text-[10px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Note Title Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Note Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'private' ? 'e.g. Session 4 - Cognitive Restructuring of Panic Trigger' : 'e.g. Takeaways & Behavioral Anchors for Next Week'}
          className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Structured Template Editors */}
      {template === 'soap' ? (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              S — Subjective (Client's reported experience, mood rating & symptoms)
            </span>
            <textarea
              rows={2}
              value={soapFields.subjective}
              onChange={(e) => setSoapFields({ ...soapFields, subjective: e.target.value })}
              placeholder="e.g. Client reports heightened somatic anxiety prior to morning standup meetings..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              O — Objective (Therapist's clinical observations, affect, speech, engagement)
            </span>
            <textarea
              rows={2}
              value={soapFields.objective}
              onChange={(e) => setSoapFields({ ...soapFields, objective: e.target.value })}
              placeholder="e.g. Alert, congruent affect, slight psychomotor agitation during recall..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              A — Assessment (Clinical impressions, response to interventions, progress)
            </span>
            <textarea
              rows={2}
              value={soapFields.assessment}
              onChange={(e) => setSoapFields({ ...soapFields, assessment: e.target.value })}
              placeholder="e.g. Catastrophic misinterpretation of palpitation symptoms..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              P — Plan (Follow-up frequency, assigned homework, safety anchors)
            </span>
            <textarea
              rows={2}
              value={soapFields.plan}
              onChange={(e) => setSoapFields({ ...soapFields, plan: e.target.value })}
              placeholder="e.g. Daily thought record, continuation of box breathing exercise..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      ) : template === 'dap' ? (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              D — Data (Observable facts, dialogue & behavior in session)
            </span>
            <textarea
              rows={3}
              value={dapFields.data}
              onChange={(e) => setDapFields({ ...dapFields, data: e.target.value })}
              placeholder="Clinical session data and behavioral observations..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              A — Assessment (Dynamic clinical analysis and working hypothesis)
            </span>
            <textarea
              rows={2}
              value={dapFields.dapAssessment}
              onChange={(e) => setDapFields({ ...dapFields, dapAssessment: e.target.value })}
              placeholder="Therapeutic evaluation of current coping progress..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              P — Plan (Targeted interventions and next appointments)
            </span>
            <textarea
              rows={2}
              value={dapFields.dapPlan}
              onChange={(e) => setDapFields({ ...dapFields, dapPlan: e.target.value })}
              placeholder="Next steps, pacing, and scheduled sessions..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        /* Freeform TipTap / Rich Text Editor area */
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes Content</label>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type comprehensive clinical observations, client quotes, cognitive interventions, and reflections here..."
            className="w-full p-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-sans leading-relaxed"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">
          Encrypted datastore • Access controlled
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button
            variant={type === 'private' ? 'primary' : 'accent'}
            onClick={handleSave}
            loading={saving}
            icon={success ? Check : Save}
          >
            {success ? 'Saved!' : type === 'private' ? 'Save Private Note' : 'Save & Share with Client'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
