// frontend/src/features/portfolio/constants.js — Central constants for Portfolio subsystem

export const BROKER_CONFIGS = {
  ZERODHA: {
    key: 'ZERODHA',
    slug: 'zerodha',
    name: 'Zerodha Kite',
    displayName: 'Zerodha',
    tagline: "India's largest stock broker",
    initials: 'ZE',
    logoPath: '/brokers/zerodha.png',
    accentColor: '#387ed1',
    accentVar: '--broker-zerodha',
    dotColor: 'bg-[#387ed1]',
    setupPath: '/brokers/zerodha',
    portalUrl: 'https://kite.zerodha.com/holdings',
    supportsMf: true,
    protocol: 'Kite Connect v3 (OAuth2)',
    defaultExchanges: ['MF', 'NSE', 'BSE'],
    defaultProducts: ['CNC', 'NRML', 'MIS', 'BO', 'CO'],
    capabilities: [
      'Holdings',
      'Positions',
      'Funds',
      'MF Holdings',
      'MF SIPs',
      'Orders',
    ],
  },
  UPSTOX: {
    key: 'UPSTOX',
    slug: 'upstox',
    name: 'Upstox',
    displayName: 'Upstox',
    tagline: 'Fast, reliable trading platform',
    initials: 'UP',
    logoPath: '/brokers/upstox-mark.svg',
    accentColor: '#7b3fe4',
    accentVar: '--broker-upstox',
    dotColor: 'bg-[#7b3fe4]',
    setupPath: '/brokers/upstox',
    portalUrl: 'https://pro.upstox.com/portfolio',
    supportsMf: false,
    protocol: 'Upstox Pro API v2 (OAuth2)',
    defaultExchanges: ['NSE', 'BSE', 'MCX'],
    defaultProducts: ['DELIVERY', 'INTRADAY', 'MTF'],
    capabilities: ['Holdings', 'Positions', 'Funds', 'Orders'],
  },
  ANGEL_ONE: {
    key: 'ANGEL_ONE',
    slug: 'angelone',
    name: 'Angel One',
    displayName: 'Angel One',
    tagline: 'Smart investing made simple',
    initials: 'AO',
    logoPath: '/brokers/angelone.png',
    accentColor: '#ff5722',
    accentVar: '--broker-angel',
    dotColor: 'bg-[#ff5722]',
    setupPath: '/brokers/angelone',
    portalUrl: 'https://trade.angelone.in/portfolio',
    supportsMf: false,
    protocol: 'SmartAPI Direct (Base32 TOTP)',
    defaultExchanges: ['NSE', 'BSE', 'MCX', 'NCDEX'],
    defaultProducts: ['DELIVERY', 'INTRADAY', 'CARRYFORWARD'],
    capabilities: ['Holdings', 'Positions', 'Funds', 'Orders', 'Trades'],
  },
};

export const BROKER_FILTER_PILLS = [
  { id: 'ALL', label: 'All demats', color: 'bg-emerald-500' },
  { id: 'ZERODHA', label: 'Zerodha Kite', color: 'bg-[#387ed1]' },
  { id: 'UPSTOX', label: 'Upstox', color: 'bg-[#7b3fe4]' },
  { id: 'ANGEL_ONE', label: 'Angel One', color: 'bg-[#ff5722]' },
];

/**
 * Normalizes any broker name/string to canonical key: ZERODHA, UPSTOX, ANGEL_ONE, or ALL.
 */
export function normalizeBrokerKey(str) {
  if (!str) return 'ALL';
  const upper = String(str)
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (upper === 'ALL' || upper === 'ALL_DEMATS') return 'ALL';
  if (upper.includes('ZERO') || upper.includes('KITE')) return 'ZERODHA';
  if (upper.includes('UPSTOX')) return 'UPSTOX';
  if (upper.includes('ANGEL')) return 'ANGEL_ONE';
  return upper;
}

/**
 * Computes dynamic tab groups per broker.
 * CRITICAL RULE: When broker is 'ALL', returns [] (tab navigation bar is hidden!).
 * When broker is 'ZERODHA': Includes EQUITY, ACTIVITY, MUTUAL FUNDS, and ACCOUNT.
 * When broker is 'UPSTOX' or 'ANGEL_ONE': Mutual funds group is omitted because
 * these brokers do not support Mutual Funds via API.
 */
export function getBrokerTabGroups(brokerKey, counts = {}) {
  const normalized = normalizeBrokerKey(brokerKey);

  // In 'ALL' demats, user explicitly specified:
  // "AND IN ALL DEMATS, THIS SHOULD NOT BE VISIBLE : EQUITY, ACTIVITY, MUTUAL FUNDS, ACCOUNT"
  if (normalized === 'ALL') {
    return [];
  }

  if (normalized === 'ZERODHA') {
    return [
      {
        groupLabel: 'EQUITY',
        tabs: [
          { id: 'holdings', label: 'Holdings', count: counts.holdings ?? 0 },
          { id: 'positions', label: 'Positions', count: counts.positions ?? 0 },
        ],
      },
      {
        groupLabel: 'ACTIVITY',
        tabs: [
          { id: 'orders', label: 'Orders', count: counts.orders ?? 0 },
          { id: 'trades', label: 'Trades', count: counts.trades ?? 0 },
        ],
      },
      {
        groupLabel: 'MUTUAL FUNDS',
        tabs: [
          {
            id: 'mf-holdings',
            label: 'MF Holdings',
            count: counts['mf-holdings'] ?? 0,
          },
          {
            id: 'mf-orders',
            label: 'MF Orders',
            count: counts['mf-orders'] ?? 0,
          },
          { id: 'mf-sips', label: 'SIPs', count: counts['mf-sips'] ?? 0 },
          { id: 'mf-timeline', label: 'Timeline' },
          { id: 'mf-instruments', label: 'Instruments' },
        ],
      },
      {
        groupLabel: 'ACCOUNT',
        tabs: [{ id: 'brokers', label: 'Brokers' }],
      },
    ];
  }

  if (normalized === 'UPSTOX') {
    return [
      {
        groupLabel: 'EQUITY',
        tabs: [
          { id: 'holdings', label: 'Holdings', count: counts.holdings ?? 0 },
          { id: 'positions', label: 'Positions', count: counts.positions ?? 0 },
        ],
      },
      {
        groupLabel: 'ACTIVITY',
        tabs: [
          { id: 'orders', label: 'Orders', count: counts.orders ?? 0 },
          { id: 'trades', label: 'Trades', count: counts.trades ?? 0 },
        ],
      },
      {
        groupLabel: 'ACCOUNT',
        tabs: [{ id: 'brokers', label: 'Brokers' }],
      },
    ];
  }

  if (normalized === 'ANGEL_ONE') {
    return [
      {
        groupLabel: 'EQUITY',
        tabs: [
          { id: 'holdings', label: 'Holdings', count: counts.holdings ?? 0 },
          { id: 'positions', label: 'Positions', count: counts.positions ?? 0 },
        ],
      },
      {
        groupLabel: 'ACTIVITY',
        tabs: [
          { id: 'orders', label: 'Orders', count: counts.orders ?? 0 },
          { id: 'trades', label: 'Trades', count: counts.trades ?? 0 },
        ],
      },
      {
        groupLabel: 'ACCOUNT',
        tabs: [{ id: 'brokers', label: 'Brokers' }],
      },
    ];
  }

  return [];
}

/**
 * Formats 16-digit CDSL Demat BOID into standard 8 + 8 mid-dot grouping:
 * "1208160002941021" -> "12081600 · 02941021"
 * Without inventing fake numbers if not present.
 */
export function formatBoid(rawBoid) {
  if (!rawBoid) return null;
  const clean = String(rawBoid).replace(/\s+/g, '');
  if (clean.length === 16) {
    return `${clean.slice(0, 8)} · ${clean.slice(8)}`;
  }
  return clean;
}
