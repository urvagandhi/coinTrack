'use client';

import {
  useBrokerConnection,
  invalidateBrokerQueries,
} from '../hooks/useBrokerConnection';
import { useSyncFeeds } from '../hooks/useSyncFeeds';
import { BrokerGuideTab } from './BrokerGuideTab';
import { BrokerSetupLayout } from './BrokerSetupLayout';
import { CredentialField } from './CredentialField';
import { ConnectionHubPanel } from './ConnectionHubPanel';
import { BROKERS as BROKER_CONFIG } from '../constants';
import { brokerAPI, BROKERS } from '@/shared/api/client';
import ConfirmDialog from '@/shared/ui/feedback/confirm-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Check, Copy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const broker = BROKER_CONFIG.ZERODHA;
const redirectUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/brokers/zerodha/callback`
    : 'https://cointrack-finance.vercel.app/brokers/zerodha/callback';

function relativeTime(iso) {
  if (!iso) return null;
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ZerodhaSetupView() {
  const queryClient = useQueryClient();
  const { data: syncData, isLoading: isSyncLoading } = useBrokerConnection();
  const brokerStatus = syncData?.brokers?.find(b => b.broker === 'ZERODHA');
  const isConnected = brokerStatus?.tokenActive ?? false;
  const isExpired = Boolean(
    brokerStatus &&
    !brokerStatus.tokenActive &&
    brokerStatus.lastStatus !== null
  );

  const [activeTab, setActiveTab] = useState('credentials');
  const [form, setForm] = useState({ apiKey: '', apiSecret: '' });
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [isEditingCreds, setIsEditingCreds] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { sync: handleManualSync, isSyncing: isManualSyncing } = useSyncFeeds({
    brokerDisplayName: 'Zerodha',
  });
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState('');
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const handleCopyRedirect = () => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(redirectUrl);
    setCopiedRedirect(true);
    toast.success('Redirect URL copied to clipboard');
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  // If connected, user can view Connection Hub; otherwise keep tab on credentials
  useEffect(() => {
    if (brokerStatus) {
      setCredentialsSaved(true);
      if (brokerStatus.tokenActive) {
        setActiveTab('hub');
      }
    }
  }, [brokerStatus]);

  const handleSaveCredentials = async () => {
    if (!form.apiKey.trim() || !form.apiSecret.trim()) {
      setError('Please provide both API Key and API Secret');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await brokerAPI.saveZerodhaCredentials({
        apiKey: form.apiKey,
        apiSecret: form.apiSecret,
      });
      setCredentialsSaved(true);
      setIsEditingCreds(false);
      toast.success('Credentials encrypted and saved. Redirecting to Zerodha…');
      await handleConnect();
    } catch (err) {
      setError(err?.message || 'Failed to save credentials');
      toast.error(err?.message || 'Failed to save credentials');
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    try {
      const response = await brokerAPI.getConnectUrl(BROKERS.ZERODHA);
      if (response?.loginUrl) {
        window.location.href = response.loginUrl;
      } else {
        throw new Error('No login URL received from Zerodha adapter');
      }
    } catch (err) {
      setError(err?.message || 'Failed to get login URL');
      toast.error(err?.message || 'Failed to get login URL');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await brokerAPI.disconnectZerodha();
      toast.success('Zerodha connection removed');
      setCredentialsSaved(false);
      setForm({ apiKey: '', apiSecret: '' });
      setShowDisconnectConfirm(false);
      setActiveTab('credentials');
      await invalidateBrokerQueries(queryClient);
    } catch (err) {
      toast.error(err?.message || 'Failed to disconnect Zerodha');
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

      {/* ── TAB 2: CREDENTIALS & KEYS (Spacious, Un-congested Layout) ── */}
      {activeTab === 'credentials' && (
        <div className='space-y-6 sm:space-y-7'>
          <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
            <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
              Credentials &amp; API Keys
            </h2>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
              Configure your Kite Connect developer credentials. All keys are
              encrypted with AES-256-GCM.
            </p>
          </div>

          {error && (
            <div className='flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300'>
              <AlertCircle className='size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5' />
              <span>{error}</span>
            </div>
          )}

          {/* Sleek Redirect URL Quick-Copy Callout */}
          <div className='p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <span className='text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block'>
                Required Kite Connect Redirect URL
              </span>
              <code className='font-mono text-xs text-neutral-800 dark:text-neutral-200 break-all select-all block mt-0.5'>
                {redirectUrl}
              </code>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <button
                type='button'
                onClick={handleCopyRedirect}
                className='inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs'
              >
                {copiedRedirect ? (
                  <>
                    <Check className='size-3.5 text-emerald-500' />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className='size-3.5 text-neutral-400' />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('guide')}
                className='inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer px-1 py-1'
              >
                <span>Full Guide</span>
                <ArrowRight className='size-3' />
              </button>
            </div>
          </div>

          {credentialsSaved && !isEditingCreds ? (
            <div className='space-y-5 max-w-2xl'>
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
                Credentials are stored securely with AES-256-GCM. Click below to
                initiate an OAuth handshake with Zerodha Kite.
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
                      <span>Redirecting to Kite Connect…</span>
                    </>
                  ) : (
                    <>
                      <span>Connect via Zerodha Kite</span>
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
            <div className='space-y-4 max-w-2xl'>
              {broker.credentialFields.map(field => (
                <CredentialField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={v => setForm(p => ({ ...p, [field.key]: v }))}
                  disabled={isSaving}
                />
              ))}

              <div className='flex items-center gap-2.5 pt-2'>
                <button
                  type='button'
                  onClick={handleSaveCredentials}
                  disabled={
                    !form.apiKey.trim() || !form.apiSecret.trim() || isSaving
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
                      <span>Save &amp; Authenticate</span>
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

      {/* ── TAB 3: DEVELOPER GUIDE (Dedicated Full Width) ── */}
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
        title='Unlink Zerodha Connection'
        description='This will clear your encrypted Zerodha API credentials and revoke active session tokens from CoinTrack. Historical portfolio snapshots already recorded will remain safe.'
        confirmLabel='Unlink Zerodha'
        confirmLoading={isDisconnecting}
        onConfirm={handleDisconnect}
        tone='destructive'
      />
    </BrokerSetupLayout>
  );
}

export default ZerodhaSetupView;
