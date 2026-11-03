'use client';

import { authAPI } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/AuthContext';
import { CoinTrackSkyBackground } from '@/shared/ui/brand/cointrack-sky-background';
import { PendingVerificationBanner } from '@/shared/ui/data-display/pending-verification-banner';
import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  const { user, refreshUser } = useAuth();

  const isEmailVerified = Boolean(user?.emailVerified ?? user?.isEmailVerified);

  const handleResendVerification = async () => {
    try {
      const result = await authAPI.resendEmailVerification();
      if (result?.alreadyVerified && refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      console.error('Failed to resend verification:', err);
    }
  };

  return (
    <div className='relative h-screen h-[100dvh] w-full flex flex-col p-2 sm:p-4 md:p-6 lg:p-7 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 overflow-hidden'>
      {/* ── ATMOSPHERIC SKY BACKDROP ── */}
      <CoinTrackSkyBackground />

      {/* ── MAIN ELEVATED CANVAS CARD (Exact matching user design) ── */}
      <div className='relative z-10 flex-1 h-full min-h-0 w-full max-w-[1720px] mx-auto rounded-[24px] sm:rounded-[32px] md:rounded-[40px] bg-white/95 dark:bg-[#121316]/95 backdrop-blur-xl border border-white/80 dark:border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)] p-4 sm:p-6 md:p-8 flex flex-col transition-colors overflow-hidden'>
        {/* Top Segmented Pill Navigation Bar */}
        <Header />

        {/* Verification Alert Banner (shown only if unverified) */}
        {user && !isEmailVerified && (
          <div className='mt-4 shrink-0'>
            <PendingVerificationBanner
              isVerified={isEmailVerified}
              userEmail={user.email}
              onResend={handleResendVerification}
            />
          </div>
        )}

        {/* Middle Canvas: Floating Sidebar Dock + Main Content Area */}
        <div className='flex-1 flex flex-col md:flex-row gap-4 sm:gap-6 pt-5 min-h-0 overflow-hidden'>
          <Sidebar />

          <main className='flex-1 h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200/80 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-800/80 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent'>
            {children}
          </main>
        </div>

        {/* Minimal Bottom Footer (outside the internal dashboard) */}
        <div className='shrink-0 pt-3'>
          <Footer />
        </div>
      </div>
    </div>
  );
}
