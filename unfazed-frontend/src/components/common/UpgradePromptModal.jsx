import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Sparkles, Check, Zap, Shield, ArrowRight } from 'lucide-react';

const UpgradePromptModal = ({ isOpen, onClose, featureKey, reason, onUpgradeSuccess }) => {
  const [selectedTier, setSelectedTier] = useState('growth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const plans = [
    {
      key: 'growth',
      name: 'Growth Tier',
      price: '₹1,999 / mo',
      desc: 'Ideal for scaling caseloads & clinical structure',
      popular: true,
      features: [
        'Up to 25 Active Clients (vs 5 on Starter)',
        'SOAP Clinical Notes Format',
        'Advanced Revenue & Status Analytics',
        'Multi-Session Packages Management',
        'Automated 24hr WhatsApp Reminders',
      ],
    },
    {
      key: 'practice',
      name: 'Practice / Scale',
      price: '₹4,999 / mo',
      desc: 'Full clinical autonomy for busy private practices',
      popular: false,
      features: [
        'Unlimited Active Clients',
        'Full Clinical Suite: SOAP & DAP Templates',
        'Custom Subdomain / White-labeling',
        'Advanced Cohort Analytics & Export',
        'Dedicated Priority Onboarding',
      ],
    },
  ];

  const handleUpgrade = async () => {
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      if (onUpgradeSuccess) {
        await onUpgradeSuccess(selectedTier);
        setSuccessMsg(`Upgraded to ${selectedTier.toUpperCase()} successfully! Feature unlocked.`);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade Your Practice Plan" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Banner with reason */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Feature Gated by Entitlement Policy</h4>
            <p className="text-sm text-amber-800 mt-0.5">
              {reason || 'This action exceeds your current tier limits or requires an upgraded plan.'}
            </p>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isSelected = selectedTier === plan.key;
            return (
              <div
                key={plan.key}
                onClick={() => setSelectedTier(plan.key)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/30 shadow-md ring-2 ring-teal-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-4 bg-teal-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-800 text-base">{plan.name}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-base">{plan.price}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm text-center font-medium animate-in fade-in">
            {successMsg}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Config-driven entitlement service</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpgrade}
              loading={isSubmitting}
              icon={ArrowRight}
            >
              Switch to {selectedTier.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradePromptModal;
