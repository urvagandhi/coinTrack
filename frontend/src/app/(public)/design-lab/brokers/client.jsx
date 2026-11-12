'use client';

import { useState } from 'react';
import {
  BROKERS,
  BrokerCard,
  BrokerSetupLayout,
  BrokerGuideTab,
  CredentialField,
  BrokerCallbackHandler,
  ConnectionHubPanel,
} from '@/features/brokers';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';
import { cn } from '@/shared/lib/utils';
import {
  Activity,
  ArrowRight,
  Clock,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export default function DesignLabBrokersClient() {
  const [selectedBrokerKey, setSelectedBrokerKey] = useState('ZERODHA');
  const [activeStep, setActiveStep] = useState('directory'); // 'directory' | 'setup_empty' | 'setup_saved' | 'setup_connected' | 'callback_loading' | 'callback_success' | 'callback_stalled' | 'callback_error'
  const [setupTab, setSetupTab] = useState('credentials');
  const [simulateLoading, setSimulateLoading] = useState(false);

  const broker = BROKERS[selectedBrokerKey] || BROKERS.ZERODHA;

  const steps = [
    { id: 'directory', label: '1. Directory' },
    { id: 'setup_empty', label: '2. Setup (No Keys)' },
    { id: 'setup_saved', label: '3. Setup (Keys Stored)' },
    { id: 'setup_connected', label: '4. Connection Hub (Live)' },
    { id: 'callback_loading', label: '5. Handshake Loading' },
    { id: 'callback_success', label: '6. Handshake Success' },
    { id: 'callback_stalled', label: '7. Handshake Stalled' },
    { id: 'callback_error', label: '8. Handshake Error' },
  ];

  const statusBadge =
    activeStep === 'setup_connected' ? (
      <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'>
        <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
        Live Stream
      </span>
    ) : activeStep === 'setup_saved' ? (
      <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60'>
        Session Expired
      </span>
    ) : (
      <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700'>
        Not Connected
      </span>
    );

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0c0d0e] selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900'>
      <DesignLabAuthNav />

      {/* Simulator Control Dock */}
      <header className='sticky top-0 z-40 bg-white/90 dark:bg-[#121316]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-6 py-3'>
        <div className='max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3'>
          {/* Title & Broker Selector */}
          <div className='flex items-center gap-3'>
            <div className='size-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center'>
              <Layers className='size-4' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white'>
                  Broker Simulator
                </span>
                <span className='text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono'>
                  Interactive Design Lab
                </span>
              </div>
              <p className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                Preview every broker step and state without real credentials or
                OAuth redirection.
              </p>
            </div>
          </div>

          {/* Broker Switcher */}
          <div className='flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none'>
            {Object.values(BROKERS).map(b => (
              <button
                key={b.key}
                type='button'
                onClick={() => setSelectedBrokerKey(b.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                  selectedBrokerKey === b.key
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                {b.logoPath ? (
                  <img
                    src={b.logoPath}
                    alt={b.displayName}
                    className='size-4 object-contain'
                  />
                ) : (
                  <span className='size-3 rounded-full bg-blue-500' />
                )}
                <span>{b.displayName}</span>
              </button>
            ))}

            <div className='h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1' />

            <button
              type='button'
              onClick={() => setSimulateLoading(l => !l)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap',
                simulateLoading
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-600'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              )}
            >
              Skeleton Loading: {simulateLoading ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Steps Bar */}
        <div className='max-w-7xl mx-auto pt-2.5 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-neutral-100 dark:border-neutral-800/60 mt-2.5'>
          {steps.map(step => (
            <button
              key={step.id}
              type='button'
              onClick={() => {
                setActiveStep(step.id);
                if (step.id === 'setup_connected') setSetupTab('hub');
                else if (step.id.startsWith('setup'))
                  setSetupTab('credentials');
              }}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap',
                activeStep === step.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className='flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0'>
        {/* ── 1. DIRECTORY STEP ── */}
        {activeStep === 'directory' && (
          <div className='space-y-6 sm:space-y-7'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
                  Broker Connections
                </h1>
                <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal max-w-2xl'>
                  Authorise your brokerage accounts to syndicate holdings,
                  positions, and funds. CoinTrack reads only — it cannot trade
                  on your behalf.
                </p>
              </div>

              <div className='flex items-center gap-2 self-start sm:self-auto'>
                <button
                  type='button'
                  className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs'
                >
                  <RefreshCw className='size-3.5' />
                  <span>Sync All Feeds</span>
                </button>
              </div>
            </div>

            {/* 4-KPI Row */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40'>
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
                  <Activity className='size-3.5 text-blue-500' />
                  <span>Active Feeds</span>
                </div>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans'>
                  {simulateLoading ? (
                    <div className='h-7 w-20 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md' />
                  ) : (
                    '1 of 3'
                  )}
                </div>
                <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                  Brokers connected
                </span>
              </div>

              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
                  <Clock className='size-3.5 text-amber-500' />
                  <span>Sync Health</span>
                </div>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans'>
                  {simulateLoading ? (
                    <div className='h-7 w-20 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md' />
                  ) : (
                    'Healthy'
                  )}
                </div>
                <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                  All active feeds normal
                </span>
              </div>

              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
                  <ShieldCheck className='size-3.5 text-emerald-500' />
                  <span>Security Mode</span>
                </div>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans text-base sm:text-lg'>
                  Read-Only Sync
                </div>
                <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                  Zero trade execution
                </span>
              </div>

              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
                  <Lock className='size-3.5 text-purple-500' />
                  <span>Storage Standard</span>
                </div>
                <div className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans text-base sm:text-lg'>
                  AES-256-GCM
                </div>
                <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                  Envelope encrypted
                </span>
              </div>
            </div>

            {/* Grid of Brokers */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {Object.values(BROKERS).map(b => (
                <BrokerCard key={b.key} broker={b} />
              ))}
            </div>
          </div>
        )}

        {/* ── 2, 3, 4: SETUP / CONNECTION STEPS ── */}
        {(activeStep === 'setup_empty' ||
          activeStep === 'setup_saved' ||
          activeStep === 'setup_connected') && (
          <BrokerSetupLayout
            broker={broker}
            activeTab={setupTab}
            onTabChange={setSetupTab}
            statusBadge={statusBadge}
            isLoading={simulateLoading}
          >
            {/* CREDENTIALS TAB */}
            {setupTab === 'credentials' && (
              <div className='space-y-6 sm:space-y-7'>
                <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
                  <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
                    Credentials &amp; API Keys
                  </h2>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                    {broker.displayName} API Keys and authentication secrets
                    encrypted with AES-256-GCM.
                  </p>
                </div>

                {activeStep === 'setup_saved' ||
                activeStep === 'setup_connected' ? (
                  /* Saved View */
                  <div className='space-y-5'>
                    {broker.credentialFields.map(field => (
                      <CredentialField
                        key={field.key}
                        field={field}
                        value='••••••••••••••••'
                        onChange={() => {}}
                        isSaved
                        onEdit={() => setActiveStep('setup_empty')}
                      />
                    ))}

                    <div className='p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed'>
                      Credentials are stored securely. Click below to initiate
                      an OAuth handshake with {broker.displayName}.
                    </div>

                    <div className='flex items-center gap-3 pt-2'>
                      <button
                        type='button'
                        onClick={() => setActiveStep('callback_loading')}
                        className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                      >
                        <span>Connect via {broker.displayName}</span>
                        <ArrowRight className='size-3.5' />
                      </button>

                      <button
                        type='button'
                        onClick={() => setActiveStep('setup_empty')}
                        className='px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs'
                      >
                        Change Keys
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty Form View */
                  <div className='space-y-4 max-w-lg'>
                    {broker.credentialFields.map(field => (
                      <CredentialField
                        key={field.key}
                        field={field}
                        value=''
                        onChange={() => {}}
                        isSaved={false}
                      />
                    ))}

                    <div className='pt-2 flex items-center gap-3'>
                      <button
                        type='button'
                        onClick={() => setActiveStep('setup_saved')}
                        className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                      >
                        <span>Save &amp; Continue</span>
                        <ArrowRight className='size-3.5' />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DEVELOPER GUIDE TAB */}
            {setupTab === 'guide' && (
              <BrokerGuideTab
                broker={broker}
                onSwitchToCredentials={() => setSetupTab('credentials')}
              />
            )}

            {/* CONNECTION HUB TAB */}
            {setupTab === 'hub' && (
              <ConnectionHubPanel
                broker={broker}
                brokerStatus={{
                  lastSuccessAt: new Date().toISOString(),
                }}
                isConnected={activeStep === 'setup_connected'}
                isExpired={false}
                lastSyncedAt={new Date().toISOString()}
                relativeTimeStr='Just now (13:45 IST)'
                onManualSync={() => {}}
                isManualSyncing={false}
                onRefreshToken={() => setActiveStep('callback_loading')}
                isRefreshingToken={false}
                onUnlink={() => setActiveStep('setup_empty')}
                isUnlinking={false}
                error=''
              />
            )}
          </BrokerSetupLayout>
        )}

        {/* ── 5, 6, 7, 8: HANDSHAKE / CALLBACK STATES ── */}
        {(activeStep === 'callback_loading' ||
          activeStep === 'callback_success' ||
          activeStep === 'callback_stalled' ||
          activeStep === 'callback_error') && (
          <BrokerCallbackHandler
            brokerKey={broker.key}
            previewState={
              activeStep === 'callback_loading'
                ? 'loading'
                : activeStep === 'callback_success'
                  ? 'success'
                  : activeStep === 'callback_stalled'
                    ? 'stalled'
                    : 'error'
            }
            onCallback={async () => {}}
          />
        )}
      </main>
    </div>
  );
}
