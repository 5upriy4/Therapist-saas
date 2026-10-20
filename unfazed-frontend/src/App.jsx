import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/common/Navbar';
import UpgradePromptModal from './components/common/UpgradePromptModal';
import useEntitlement from './hooks/useEntitlement';

const AppContent = () => {
  const { upgradeModalState, openUpgradeModal, closeUpgradeModal, upgradeTier } = useEntitlement();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40 text-slate-900 selection:bg-teal-500 selection:text-white">
      <Navbar onOpenUpgradeModal={() => openUpgradeModal('NAV_PLAN_VIEW')} />
      <main className="flex-1">
        <AppRoutes />
      </main>

      {/* Global Entitlement Upgrade Modal */}
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
