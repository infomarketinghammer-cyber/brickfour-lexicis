/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import { AppTab, Case, User } from './types';
import { useSession } from './hooks/useSession';
import { usePortfolio } from './hooks/usePortfolio';
import { useSupabaseStatus } from './hooks/useSupabaseStatus';
import { dismissWelcomeCoach, isWelcomeCoachDismissed } from './lib/storage';
import LoginForm from './components/auth/LoginForm';
import DashboardHeader from './components/layout/DashboardHeader';
import AppFooter from './components/layout/AppFooter';
import AttorneyWorkspace from './components/workspace/AttorneyWorkspace';
import ClientWorkspace from './components/workspace/ClientWorkspace';
import NoCaseSelected from './components/workspace/NoCaseSelected';
import CaseSearch from './components/search/CaseSearch';
import CaseDetailView from './components/case-detail/CaseDetailView';
import EmailOutbox from './components/outbox/EmailOutbox';
import FutureCasePredictor from './components/strategy/FutureCasePredictor';
import AiCoachWelcomeModal from './components/common/AiCoachWelcomeModal';
import ConfirmUnbindModal from './components/common/ConfirmUnbindModal';

export default function App() {
  const { user, login, logout, updateUser } = useSession();
  const portfolio = usePortfolio(user?.id);
  const { trackedCases, selectedCase, setSelectedCase } = portfolio;
  const supabase = useSupabaseStatus(portfolio.refresh, !!user);

  const [activeTab, setActiveTab] = useState<AppTab>('search');

  // AI Coach welcome pop-up state
  const [showAiCoachWelcome, setShowAiCoachWelcome] = useState(false);
  const [autoOpenChat, setAutoOpenChat] = useState(false);

  // Supabase Cloud database status modal
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Case awaiting unbind confirmation
  const [caseToUnbind, setCaseToUnbind] = useState<Case | null>(null);

  // Show the AI Coach pop-up shortly after sign-in, once per browser session
  useEffect(() => {
    if (user) {
      if (!isWelcomeCoachDismissed()) {
        const timer = setTimeout(() => setShowAiCoachWelcome(true), 1200);
        return () => clearTimeout(timer);
      }
    } else {
      setShowAiCoachWelcome(false);
    }
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    login(loggedInUser);
    setActiveTab('search');
  };

  const closeWelcomeCoach = () => {
    setShowAiCoachWelcome(false);
    dismissWelcomeCoach();
  };

  const consultWelcomeCoach = () => {
    closeWelcomeCoach();
    if (trackedCases.length > 0) {
      if (!selectedCase) {
        setSelectedCase(trackedCases[0]);
      }
      setActiveTab('insights');
      setAutoOpenChat(true);
    } else {
      setActiveTab('search');
      alert("Please search and track any case in the Lexicis Search Registry first to begin AI Strategic Coaching!");
    }
  };

  const confirmUnbindCase = () => {
    if (!caseToUnbind) return;
    const targetCaseId = caseToUnbind.id;
    setCaseToUnbind(null);
    portfolio.untrackCase(targetCaseId);
  };

  // Open a portfolio case in the insights view
  const selectCaseFromWorkspace = (c: Case) => {
    setSelectedCase(c);
    setActiveTab('insights');
  };

  if (!user) {
    return <LoginForm onAuthSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-100 selection:text-brand-900">

      {/* Universal Dashboard Header Controls */}
      <DashboardHeader
        user={user}
        onLogout={logout}
        onUserUpdate={updateUser}
        supabaseStatus={supabase.status}
        onRetrySupabase={supabase.retry}
        showSupabaseModal={showSupabaseModal}
        setShowSupabaseModal={setShowSupabaseModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCase={selectedCase}
      />

      {/* Main Dashboard Panel body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {portfolio.isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Scale className="h-10 w-10 text-amber-500 animate-pulse" />
            <p className="text-sm text-slate-500 font-medium">Synchronizing with Lexicis Search Registry...</p>
          </div>
        ) : (
          <div className="animate-fade-in">

            {/* VIEW: Main Workspace (Dashboard) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {user.role === 'attorney' ? (
                  <AttorneyWorkspace
                    attorneyName={user.name}
                    trackedCases={trackedCases}
                    onSelectCase={selectCaseFromWorkspace}
                    onUntrackCase={setCaseToUnbind}
                    selectedCaseId={selectedCase?.id}
                  />
                ) : (
                  <ClientWorkspace
                    trackedCases={trackedCases}
                    allHearings={portfolio.allHearings}
                    onSelectCase={selectCaseFromWorkspace}
                    onUntrackCase={setCaseToUnbind}
                    selectedCaseId={selectedCase?.id}
                  />
                )}
              </div>
            )}

            {/* VIEW: Search Registry */}
            {activeTab === 'search' && (
              <CaseSearch
                trackedCaseIds={trackedCases.map(c => c.id)}
                onTrackCase={portfolio.trackCase}
                onTrackCasesBulk={portfolio.trackCasesBulk}
                onUntrackCase={setCaseToUnbind}
              />
            )}

            {/* VIEW: Active Case Details & AI Coach insights */}
            {activeTab === 'insights' && (
              selectedCase ? (
                <CaseDetailView
                  caseItem={selectedCase}
                  autoOpenChat={autoOpenChat}
                  onChatOpenChange={setAutoOpenChat}
                  onUntrackCase={setCaseToUnbind}
                />
              ) : (
                <NoCaseSelected onGoToPortfolio={() => setActiveTab('dashboard')} />
              )
            )}

            {/* VIEW: Outbox Logs */}
            {activeTab === 'outbox' && (
              <EmailOutbox
                emailLogs={portfolio.emailLogs}
                onRefresh={portfolio.refresh}
              />
            )}

            {/* VIEW: Legal Strategy & Predictor */}
            {activeTab === 'strategy' && (
              <FutureCasePredictor
                onSaveAsCase={(newCase) => {
                  portfolio.trackCasesBulk([newCase]);
                  setSelectedCase(newCase);
                  setActiveTab('insights');
                }}
              />
            )}

          </div>
        )}

      </main>

      <AppFooter />

      {showAiCoachWelcome && (
        <AiCoachWelcomeModal onDismiss={closeWelcomeCoach} onConsultCoach={consultWelcomeCoach} />
      )}

      {caseToUnbind && (
        <ConfirmUnbindModal
          caseItem={caseToUnbind}
          onCancel={() => setCaseToUnbind(null)}
          onConfirm={confirmUnbindCase}
        />
      )}

    </div>
  );
}
