/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogOut, LayoutDashboard, Search, ShieldAlert, Sparkles, LucideIcon } from 'lucide-react';
import { appLogo } from '../../assets/logo';
import { AppTab, Case, SupabaseStatus, User } from '../../types';
import ProfileModal from './ProfileModal';
import SupabaseStatusModal from './SupabaseStatusModal';

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (updatedUser: User) => void;
  supabaseStatus: SupabaseStatus | null;
  onRetrySupabase: () => Promise<void>;
  showSupabaseModal: boolean;
  setShowSupabaseModal: (show: boolean) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedCase?: Case | null;
}

const NAV_TABS: { id: AppTab; label: string; icon: LucideIcon; iconClassName: string }[] = [
  { id: 'search', label: 'Search Registry', icon: Search, iconClassName: 'h-4 w-4 flex-shrink-0 text-sky-200' },
  { id: 'dashboard', label: 'Workspace', icon: LayoutDashboard, iconClassName: 'h-4 w-4 flex-shrink-0 text-brand-100' },
  { id: 'insights', label: 'Active Case & AI Coach', icon: Sparkles, iconClassName: 'h-4 w-4 flex-shrink-0 text-amber-300 fill-current' },
  { id: 'strategy', label: 'Legal Strategy & Predictor', icon: ShieldAlert, iconClassName: 'h-4 w-4 flex-shrink-0 text-brand-200' }
];

function getInitials(name: string): string {
  return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AK';
}

export default function DashboardHeader({
  user,
  onLogout,
  onUserUpdate,
  supabaseStatus,
  onRetrySupabase,
  showSupabaseModal,
  setShowSupabaseModal,
  activeTab,
  setActiveTab,
  selectedCase
}: DashboardHeaderProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <header className="bg-brand-600 border-b border-brand-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">

          {/* Logo & Branding (the red-on-white logo sits on a white tile) */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <span className="bg-white rounded-md px-1.5 py-1 shadow-xs flex items-center">
              <img src={appLogo} alt="LEXICIS" className="h-5 w-auto object-contain" />
            </span>
            <span className="font-display font-bold text-lg sm:text-xl tracking-wider text-white">LEXICIS</span>
          </div>

          {/* Navigation Tabs in Header */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none flex-nowrap py-1">
            {NAV_TABS.map(({ id, label, icon: Icon, iconClassName }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-1.5 py-1.5 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  activeTab === id
                    ? 'bg-white/15 text-white font-bold border-b-2 border-amber-400 shadow-xs'
                    : 'text-brand-100 hover:bg-white/10 hover:text-white border-b-2 border-transparent'
                }`}
                title={id === 'insights'
                  ? (!selectedCase ? "View AI coach & case insights" : "View complete timeline and AI recovery suggestions")
                  : undefined}
                id={`tab-btn-${id}`}
              >
                <Icon className={iconClassName} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right Navigation Controls */}
          <div className="flex items-center space-x-3 flex-shrink-0">

            {/* User credentials & profile button */}
            <div className="flex items-center space-x-3 pl-2 border-l border-white/20">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2.5 text-left group cursor-pointer p-1.5 rounded-lg hover:bg-white/10 transition-all"
                title="View & Edit Profile"
                id="btn-user-profile"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs border border-amber-300 shadow-xs group-hover:scale-105 transition-transform">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-brand-200 font-medium">
                    {user.profession || 'Legal Executive'}
                  </div>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-md hover:bg-white/10 text-brand-100 hover:text-rose-200 transition-all cursor-pointer"
                title="Logout of session"
                id="btn-logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      <ProfileModal
        user={user}
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUserUpdate={onUserUpdate}
        onPasswordChanged={() => setActiveTab('dashboard')}
      />

      {showSupabaseModal && supabaseStatus && (
        <SupabaseStatusModal
          status={supabaseStatus}
          onClose={() => setShowSupabaseModal(false)}
          onRetry={onRetrySupabase}
        />
      )}
    </header>
  );
}
