'use client';

import {
  useBrokerConnection,
  invalidateBrokerQueries,
} from '../hooks/useBrokerConnection';
import { BrokerGuideTab } from './BrokerGuideTab';
import { BrokerSetupLayout } from './BrokerSetupLayout';
import { CredentialField } from './CredentialField';
import { ConnectionHubPanel } from './ConnectionHubPanel';
import { BROKERS as BROKER_CONFIG } from '../constants';
import { brokerAPI, portfolioAPI } from '@/shared/api/client';
import ConfirmDialog from '@/shared/ui/feedback/confirm-dialog';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const broker = BROKER_CONFIG.ANGEL_ONE;
const EMPTY_FORM = { apiKey: '', clientCode: '', password: '', totpSecret: '' };

function relativeTime(iso) {
  if (!iso) return null;
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AngelOneSetupView() {
  const queryClient = useQueryClient();
  const { data: syncData, isLoading: isSyncLoading } = useBrokerConnection();
  const brokerStatus = syncData?.brokers?.find(b => b.broker === 'ANGEL_ONE');
  const isConnected = brokerStatus?.tokenActive ?? false;
  const isExpired = Boolean(
    brokerStatus &&
    !brokerStatus.tokenActive &&
    brokerStatus.lastStatus !== null
  );

  const [activeTab, setActiveTab] = useState('credentials');
  const [form, setForm] = useState(EMPTY_FORM);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [isEditingCreds, setIsEditingCreds] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (brokerStatus) {
      setCredentialsSaved(true);
      if (brokerStatus.tokenActive) {
        setActiveTab('hub');
      }
    }
  }, [brokerStatus]);

  const handleSaveCredentials = async () => {
    const required = broker.credentialFields.map(f => f.key);
    const missing = required.filter(k => !form[k]?.trim());
    if (missing.length) {
      setError(`Please complete all required fields: ${missing.join(', ')}`);
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await brokerAPI.saveAngelOneCredentials(form);
      setCredentialsSaved(true);
      setIsEditingCreds(false);
      toast.success('Angel One credentials encrypted and stored');
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      await handleConnect();
    } catch (err) {
      const msg = err?.message || 'Failed to save credentials';
      setError(msg);
      toast.error(msg);
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    try {
      await brokerAPI.connectAngelOne();
      toast.success('Angel One connected successfully');
      try {
        await portfolioAPI.manualRefresh();
      } catch {
        /* Non-critical initial sync */
      }
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    } catch (err) {
      const msg = err?.message || 'Connection failed';
      let friendly = msg;
      if (msg.toLowerCase().includes('totp')) {
        friendly =
          'The TOTP secret appears incorrect. Verify it matches the Base32 seed from Angel One Security settings.';
      } else if (
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('invalid')
      ) {
        friendly =
          'Client Code or password is incorrect. Please check and try again.';
      }
      setError(friendly);
      toast.error(friendly);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await portfolioAPI.manualRefresh();
      toast.success('Angel One portfolio synchronized');
      await invalidateBrokerQueries(queryClient);
    } catch (err) {
      toast.error(err?.message || 'Manual sync failed');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await brokerAPI.disconnectAngelOne();
      toast.success('Angel One account disconnected');
      setCredentialsSaved(false);
      setForm(EMPTY_FORM);
      setShowDisconnectConfirm(false);
      setActiveTab('credentials');
      await invalidateBrokerQueries(queryClient);
    } catch (err) {
      toast.error(err?.message || 'Failed to disconnect Angel One');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const statusBadge = isConnected ? (
    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'>
      <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
      Live Stream
    </span>
  ) : isExpired ? (
    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60'>
      Session Expired
    </span>
  ) : (
    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700'>
      Not Connected
    </span>
  );

  return (
    <BrokerSetupLayout
      broker={broker}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      statusBadge={statusBadge}
      isLoading={isSyncLoading}
    >
      {/* ── TAB 1: CONNECTION HUB ── */}
      {activeTab === 'hub' && (
        <ConnectionHubPanel
          broker={broker}
          brokerStatus={brokerStatus}
          isConnected={isConnected}
          isExpired={isExpired}
          lastSyncedAt={brokerStatus?.lastSuccessAt}
          relativeTimeStr={
            brokerStatus?.lastSuccessAt
              ? `${new Date(brokerStatus.lastSuccessAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })} IST (${relativeTime(brokerStatus.lastSuccessAt)})`
              : null
          }
          onManualSync={handleManualSync}
          isManualSyncing={isManualSyncing}
          onRefreshToken={handleConnect}
          isRefreshingToken={isConnecting}
          onUnlink={() => setShowDisconnectConfirm(true)}
          isUnlinking={isDisconnecting}
          error={error}
        />
      )}

      {/* ── TAB 2: CREDENTIALS & KEYS ── */}
      {activeTab === 'credentials' && (
        <div className='space-y-6 sm:space-y-7'>
          <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
            <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
              Credentials &amp; API Keys
            </h2>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
              Angel One SmartAPI Key, Client Code, MPIN Password, and Base32
              TOTP Seed.
            </p>
          </div>

          {error && (
            <div className='flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300'>
              <AlertCircle className='size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5' />
              <span>{error}</span>
            </div>
          )}

          {credentialsSaved && !isEditingCreds ? (
            <div className='space-y-5'>
              {broker.credentialFields.map(field => (
                <CredentialField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={() => {}}
                  isSaved
                  onEdit={() => setIsEditingCreds(true)}
                />
              ))}

              <div className='p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed'>
                Credentials stored. CoinTrack generates your TOTP server-side
                and logs in directly via SmartAPI.
              </div>

              <div className='flex items-center gap-3 pt-2'>
                <button
                  type='button'
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className='size-3.5 animate-spin' />
                      <span>Authenticating Angel One…</span>
                    </>
                  ) : (
                    <>
                      <span>Connect Angel One</span>
                      <ArrowRight className='size-3.5' />
                    </>
                  )}
                </button>

                <button
                  type='button'
                  onClick={() => setIsEditingCreds(true)}
                  className='px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs'
                >
                  Change Keys
                </button>
              </div>
            </div>
          ) : (
            <div className='space-y-4 max-w-lg'>
              {broker.credentialFields.map(field => (
                <CredentialField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={v => setForm(p => ({ ...p, [field.key]: v }))}
                  disabled={isSaving}
                />
              ))}

              <div className='p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-start gap-3 text-xs text-neutral-500 dark:text-neutral-400'>
                <Info className='size-4 text-blue-500 shrink-0 mt-0.5' />
                <p className='leading-relaxed'>
                  Your TOTP secret is the 32-character Base32 seed displayed
                  when enabling TOTP at SmartAPI (e.g.{' '}
                  <code className='font-mono font-semibold text-neutral-800 dark:text-neutral-200'>
                    JBSWY3DPEHPK3PXP
                  </code>
                  ), NOT the 6-digit rolling code.
                </p>
              </div>

              <div className='flex items-center gap-2.5 pt-2'>
                <button
                  type='button'
                  onClick={handleSaveCredentials}
                  disabled={
                    isSaving ||
                    broker.credentialFields.some(f => !form[f.key]?.trim())
                  }
                  className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 cursor-pointer shadow-xs'
                >
                  {isSaving ? (
                    <>
                      <Loader2 className='size-3.5 animate-spin' />
                      <span>Encrypting &amp; Connecting…</span>
                    </>
                  ) : (
                    <>
                      <span>Save &amp; Connect</span>
                      <ArrowRight className='size-3.5' />
                    </>
                  )}
                </button>

                {credentialsSaved && (
                  <button
                    type='button'
                    onClick={() => setIsEditingCreds(false)}
                    className='px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: DEVELOPER GUIDE ── */}
      {activeTab === 'guide' && (
        <BrokerGuideTab
          broker={broker}
          onSwitchToCredentials={() => setActiveTab('credentials')}
        />
      )}

      {/* Disconnect Confirmation Modal */}
      <ConfirmDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
        title='Unlink Angel One Connection'
        description='This will clear your encrypted SmartAPI credentials and revoke session tokens from CoinTrack. Historical portfolio snapshots already recorded will remain safe.'
        confirmLabel='Unlink Angel One'
        confirmLoading={isDisconnecting}
        onConfirm={handleDisconnect}
        tone='destructive'
      />
    </BrokerSetupLayout>
  );
}

export default AngelOneSetupView;
