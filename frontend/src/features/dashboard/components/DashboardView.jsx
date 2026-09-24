'use client';

import { useAuth } from '@/shared/auth/AuthContext';
import { BrokerStatusBanner } from '@/widgets/broker-status-banner';
import HoldingsTable from './HoldingsTable';
import PortfolioSummary from './PortfolioSummary';
import RefreshButton from './RefreshButton';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || user?.username || 'reader';
  const today = new Date();
  const dateLine = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className='space-y-8'>
      {/* Editorial masthead — newspaper page-header */}
      <header className='relative pb-6 border-b border-hairline'>
        <div className='flex items-center justify-between gap-4 mb-5'>
          <div className='flex items-center gap-3'>
            <span className='index-num'>FOLIO</span>
            <span className='font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground'>
              {dateLine}
            </span>
          </div>
          <RefreshButton />
        </div>
        <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-3'>
          <div>
            <p className='text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1'>
              Dispatch § 01 · {getGreeting()}
            </p>
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-foreground'>
              The Ledger of <span className='italic'>{firstName}</span>.
            </h1>
          </div>
        </div>
      </header>

      {/* Broker connection alert */}
      <BrokerStatusBanner />

      {/* Hero numbers — broadsheet front-page summary */}
      <PortfolioSummary />

      {/* Holdings — financial listings table */}
      <section>
        <HoldingsTable />
      </section>
    </div>
  );
}

export default DashboardView;
