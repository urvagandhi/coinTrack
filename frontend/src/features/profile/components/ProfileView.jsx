'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/auth/AuthContext';
import { userAPI } from '@/shared/api/client';
import { ProfileSidebar } from './ProfileSidebar';
import { MyProfileTab } from './MyProfileTab';
import { SecurityOptionsTab } from './SecurityOptionsTab';
import { PreferencesTab } from './PreferencesTab';
import { NotificationsTab } from './NotificationsTab';
import { DangerZoneTab } from './DangerZoneTab';

export function ProfileView() {
  const { user, resetTotp, verifyResetTotp, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: apiUser } = useQuery({
    queryKey: ['profile'],
    queryFn: userAPI.getProfile,
    initialData: user,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className='w-full h-full min-h-0 flex-1 flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch md:overflow-hidden'>
      {/* ── LEFT SETTINGS NAVIGATION SIDEBAR (Non-scrolling static docked) ── */}
      <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── RIGHT MAIN SETTINGS CONTENT CARD (Dynamic internal scrolling) ── */}
      <section
        aria-label='Settings Content'
        className='flex-1 h-full min-h-0 w-full min-w-0 bg-white dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs transition-colors overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent overscroll-contain'
      >
        {activeTab === 'profile' && (
          <MyProfileTab apiUser={apiUser} refreshUser={refreshUser} />
        )}

        {activeTab === 'security' && (
          <SecurityOptionsTab
            user={apiUser || user}
            resetTotp={resetTotp}
            verifyResetTotp={verifyResetTotp}
          />
        )}

        {activeTab === 'preferences' && <PreferencesTab />}

        {activeTab === 'notifications' && <NotificationsTab />}

        {activeTab === 'danger' && <DangerZoneTab apiUser={apiUser} />}
      </section>
    </div>
  );
}

export default ProfileView;
