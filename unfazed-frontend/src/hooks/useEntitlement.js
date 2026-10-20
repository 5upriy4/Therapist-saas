import { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export const useEntitlement = () => {
  const { user, isTherapist } = useAuth();
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upgradeModalState, setUpgradeModalState] = useState({
    isOpen: false,
    featureKey: '',
    reason: '',
  });

  const fetchEntitlements = useCallback(async () => {
    if (!isTherapist) return;
    try {
      setLoading(true);
      const res = await api.get('/therapist/entitlements');
      if (res.data?.success) {
        setEntitlements(res.data.entitlements);
      }
    } catch (err) {
      console.warn('Could not load entitlements', err.message);
    } finally {
      setLoading(false);
    }
  }, [isTherapist]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements, user?.tier]);

  // Listen for 403 upgrade required events emitted by axiosInstance interceptor
  useEffect(() => {
    const handleUpgradeEvent = (e) => {
      const data = e.detail || {};
      setUpgradeModalState({
        isOpen: true,
        featureKey: data.featureKey || 'FEATURE_LOCKED',
        reason: data.error || 'This feature requires a plan upgrade.',
      });
    };

    window.addEventListener('unfazed_upgrade_required', handleUpgradeEvent);
    return () => window.removeEventListener('unfazed_upgrade_required', handleUpgradeEvent);
  }, []);

  const openUpgradeModal = (featureKey, reason) => {
    setUpgradeModalState({
      isOpen: true,
      featureKey,
      reason: reason || 'Upgrade your practice plan to unlock this advanced feature.',
    });
  };

  const closeUpgradeModal = () => {
    setUpgradeModalState({
      isOpen: false,
      featureKey: '',
      reason: '',
    });
  };

  // Feature gate checks:
  const canUseNoteTemplate = (template = 'freeform') => {
    if (template === 'freeform') return true;
    const allowed = entitlements?.features?.allowedNoteTemplates || ['freeform'];
    return allowed.includes(template.toLowerCase());
  };

  const canAddMoreClients = () => {
    const current = entitlements?.usage?.activeClientsCount ?? 0;
    const max = entitlements?.features?.maxActiveClients ?? 5;
    return current < max;
  };

  const hasAdvancedAnalytics = () => {
    return entitlements?.features?.analyticsDepth === 'advanced';
  };

  const canManagePackages = () => {
    return Boolean(entitlements?.features?.packageManagement);
  };

  const upgradeTier = async (newTierKey) => {
    const res = await api.post('/therapist/upgrade-tier', { tierKey: newTierKey });
    if (res.data?.success) {
      await fetchEntitlements();
      closeUpgradeModal();
      return res.data;
    }
    throw new Error(res.data?.error || 'Upgrade failed');
  };

  return {
    entitlements,
    loading,
    tierName: entitlements?.tierName || 'Starter Tier',
    tierKey: entitlements?.tierKey || 'starter',
    activeClientsCount: entitlements?.usage?.activeClientsCount || 0,
    maxActiveClients: entitlements?.features?.maxActiveClients || 5,
    canUseNoteTemplate,
    canAddMoreClients,
    hasAdvancedAnalytics,
    canManagePackages,
    upgradeModalState,
    openUpgradeModal,
    closeUpgradeModal,
    upgradeTier,
    refreshEntitlements: fetchEntitlements,
  };
};

export default useEntitlement;
