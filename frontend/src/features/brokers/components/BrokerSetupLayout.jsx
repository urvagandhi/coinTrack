'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BrokerSidebar } from './BrokerSidebar';

/**
 * Standardized Two-Column Layout for Broker Subviews.
 * Adheres strictly to the ProfileView architecture:
 * - Left: Static docked sub-sidebar (BrokerSidebar).
 * - Right: Spacious section card with internal scrolling.
 */
export function BrokerSetupLayout({
  broker,
  activeTab = 'credentials',
  onTabChange,
  statusBadge,
  children,
  isLoading = false,
}) {
  return (
    <div className='w-full h-full min-h-0 flex-1 flex flex-col gap-3 sm:gap-4 md:overflow-hidden'>
      {/* ── TOP BACK NAVIGATION (Fixed header, never scrolls) ── */}
      <div className='shrink-0'>
        <Link
          href='/brokers'
          className='inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
        >
          <ArrowLeft className='size-3.5' />
          <span>Back to Broker Directory</span>
        </Link>
      </div>

      {/* ── TWO-COLUMN EXPERIENCE (Exact match to ProfileView architecture) ── */}
      <div className='w-full min-h-0 flex-1 flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch md:overflow-hidden'>
        {/* Left Sub-Sidebar (Fixed / Docked Static Navigation) */}
        <BrokerSidebar
          broker={broker}
          activeTab={activeTab}
          onTabChange={onTabChange}
          statusBadge={statusBadge}
          isLoading={isLoading}
        />

        {/* Right Main Content Card (Dynamic Internal Vertical Scrolling) */}
        <section
          aria-label={`${broker.displayName} Setup Content`}
          className='flex-1 h-full min-h-0 w-full min-w-0 bg-white dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs transition-colors overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent overscroll-contain'
        >
          {children}
        </section>
      </div>
    </div>
  );
}

export default BrokerSetupLayout;
