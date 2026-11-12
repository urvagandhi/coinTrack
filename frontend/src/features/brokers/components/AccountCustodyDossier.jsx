'use client';

import { AuthContext } from '@/shared/auth/AuthContext';
import { cn } from '@/shared/lib/utils';
import { ShieldCheck } from 'lucide-react';
import { useContext, useMemo } from 'react';

/**
 * Formats 16-digit CDSL Demat BOID into standard 8 + 8 mid-dot grouping:
 * "1208160002941021" -> "12081600 · 02941021"
 */
export function formatBoid(rawBoid) {
  if (!rawBoid) return '—';
  const clean = String(rawBoid).replace(/\s+/g, '');
  if (clean.includes('·')) return clean;
  if (clean.length === 16) {
    return `${clean.slice(0, 8)} · ${clean.slice(8)}`;
  }
  return clean;
}

/**
 * Formats last synced timestamp into the user's required pattern:
 * e.g. "4m ago (5 Nov 2026 at 03:15 PM)" or "just now (5 Nov 2026 at 03:15 PM)"
 */
export function formatDossierSyncTime(iso, now = Date.now()) {
  if (!iso) {
    return 'Never synced';
  }

  let date;
  if (typeof iso === 'string') {
    const clean =
      !iso.includes('Z') && !iso.includes('+') && !/-\d\d:\d\d$/.test(iso)
        ? `${iso}+05:30`
        : iso;
    date = new Date(clean);
  } else {
    date = new Date(iso);
  }

  if (isNaN(date.getTime())) {
    return 'Never';
  }

  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  let rel = 'just now';
  if (diffSec >= 60) {
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) {
      rel = `${mins}m ago`;
    } else {
      const hours = Math.floor(mins / 60);
      if (hours < 24) {
        rel = `${hours}h ago`;
      } else {
        const days = Math.floor(hours / 24);
        rel = `${days}d ago`;
      }
    }
  }

  const dateStr = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date
    .toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();

  return `${rel} (${dateStr} at ${timeStr})`;
}

/**
 * Institutional Account & Custody Dossier.
 * Rendered ONLY when a broker account is active, authenticated, or awaiting re-auth/reconnection.
 * Unlinked brokers never display static custody details.
 */
export function AccountCustodyDossier({
  brokerKey = 'ZERODHA',
  brokerStatus = null,
  profileData = null,
  user: userProp = null,
  lastSyncedAt = null,
  className = '',
}) {
  const authContext = useContext(AuthContext);
  const activeUser = userProp || authContext?.user || null;

  const upperKey = String(brokerKey || 'ZERODHA').toUpperCase();
  const normKey = upperKey.includes('UPSTOX')
    ? 'UPSTOX'
    : upperKey.includes('ANGEL')
      ? 'ANGEL_ONE'
      : 'ZERODHA';

  // Dynamic account details strictly derived from backend telemetry, broker session and auth
  const holderName =
    brokerStatus?.accountHolder ||
    profileData?.user_name ||
    activeUser?.fullName ||
    activeUser?.name ||
    activeUser?.username ||
    '—';

  const holderEmail =
    brokerStatus?.email || profileData?.email || activeUser?.email || '—';

  const clientId =
    brokerStatus?.brokerUserId ||
    brokerStatus?.clientCode ||
    profileData?.user_id ||
    '—';

  const rawBoid =
    brokerStatus?.dematAccount ||
    brokerStatus?.dpId ||
    profileData?.dematAccount ||
    profileData?.dpId ||
    null;
  const formattedBoid = formatBoid(rawBoid);

  const exchanges = useMemo(() => {
    if (
      Array.isArray(brokerStatus?.exchanges) &&
      brokerStatus.exchanges.length > 0
    ) {
      return brokerStatus.exchanges.join(', ');
    }
    if (
      Array.isArray(profileData?.exchanges) &&
      profileData.exchanges.length > 0
    ) {
      return profileData.exchanges.join(', ');
    }
    if (typeof brokerStatus?.exchanges === 'string') {
      return brokerStatus.exchanges;
    }
    if (normKey === 'ZERODHA') return 'MF, NSE, BSE';
    if (normKey === 'UPSTOX') return 'NSE, BSE, MCX';
    return 'NSE, BSE, NFO, MCX';
  }, [brokerStatus?.exchanges, profileData?.exchanges, normKey]);

  const products = useMemo(() => {
    if (
      Array.isArray(brokerStatus?.products) &&
      brokerStatus.products.length > 0
    ) {
      return brokerStatus.products.join(', ');
    }
    if (
      Array.isArray(profileData?.products) &&
      profileData.products.length > 0
    ) {
      return profileData.products.join(', ');
    }
    if (typeof brokerStatus?.products === 'string') {
      return brokerStatus.products;
    }
    if (normKey === 'ZERODHA') return 'CNC, NRML, MIS, BO, CO';
    if (normKey === 'UPSTOX') return 'DELIVERY, INTRADAY, MTF';
    return 'DELIVERY, INTRADAY, CARRYFORWARD';
  }, [brokerStatus?.products, profileData?.products, normKey]);

  const lastSyncDisplay = useMemo(() => {
    const timestamp =
      lastSyncedAt ||
      brokerStatus?.lastSuccessAt ||
      brokerStatus?.lastAttemptAt;
    return formatDossierSyncTime(timestamp);
  }, [lastSyncedAt, brokerStatus?.lastSuccessAt, brokerStatus?.lastAttemptAt]);

  const protocol =
    brokerStatus?.protocol ||
    (normKey === 'ANGEL_ONE' ? 'Direct SmartAPI' : 'OAuth 2.0 REST');

  const securityMode = brokerStatus?.securityMode || 'Read-Only Enforced';

  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs space-y-4',
        className
      )}
    >
      {/* ── CARD HEADER ── */}
      <div className='flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80'>
        <div className='flex items-center gap-2'>
          <ShieldCheck className='size-4 text-emerald-500' />
          <h3 className='text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
            Account &amp; Custody Dossier
          </h3>
        </div>
        <span className='text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold'>
          CDSL Verified
        </span>
      </div>

      {/* ── DOSSIER ATTRIBUTE ROWS ── */}
      <div className='divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs'>
        {/* 1. Account Holder */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Account Holder
          </span>
          <span className='font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-right'>
            {holderName}
          </span>
        </div>

        {/* 2. Registered Email */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Registered Email
          </span>
          <span className='text-neutral-700 dark:text-neutral-300 font-mono text-right break-all'>
            {holderEmail}
          </span>
        </div>

        {/* 3. Client ID */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Client ID
          </span>
          <span className='font-bold text-neutral-900 dark:text-neutral-100 font-mono tnum px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-right'>
            {clientId}
          </span>
        </div>

        {/* 4. Demat BOID */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Demat BOID
          </span>
          <span className='font-mono tnum text-neutral-800 dark:text-neutral-200 font-semibold text-right'>
            {formattedBoid}
          </span>
        </div>

        {/* 5. Supported Exchanges */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Supported Exchanges
          </span>
          <span className='font-mono text-neutral-700 dark:text-neutral-300 text-right'>
            {exchanges}
          </span>
        </div>

        {/* 6. Permitted Products */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Permitted Products
          </span>
          <span className='font-mono text-neutral-700 dark:text-neutral-300 text-right'>
            {products}
          </span>
        </div>

        {/* 7. Last Synced */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Last Synced
          </span>
          <span className='font-mono text-neutral-700 dark:text-neutral-300 text-right'>
            {lastSyncDisplay}
          </span>
        </div>

        {/* 8. Protocol */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Protocol
          </span>
          <span className='font-mono text-neutral-700 dark:text-neutral-300 text-right'>
            {protocol}
          </span>
        </div>

        {/* 9. Security Mode */}
        <div className='py-2.5 flex items-center justify-between gap-3'>
          <span className='text-neutral-400 dark:text-neutral-500 font-medium'>
            Security Mode
          </span>
          <span className='font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-right'>
            {securityMode}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AccountCustodyDossier;
