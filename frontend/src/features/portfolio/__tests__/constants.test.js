import {
  BROKER_CONFIGS,
  BROKER_FILTER_PILLS,
  formatBoid,
  getBrokerTabGroups,
  normalizeBrokerKey,
} from '../constants';

describe('Portfolio Constants & Rules', () => {
  describe('normalizeBrokerKey', () => {
    it('normalizes null, undefined, empty to ALL', () => {
      expect(normalizeBrokerKey(null)).toBe('ALL');
      expect(normalizeBrokerKey(undefined)).toBe('ALL');
      expect(normalizeBrokerKey('')).toBe('ALL');
      expect(normalizeBrokerKey('all')).toBe('ALL');
      expect(normalizeBrokerKey('All demats')).toBe('ALL');
    });

    it('normalizes Zerodha variations', () => {
      expect(normalizeBrokerKey('ZERODHA')).toBe('ZERODHA');
      expect(normalizeBrokerKey('Zerodha')).toBe('ZERODHA');
      expect(normalizeBrokerKey('zerodha-kite')).toBe('ZERODHA');
      expect(normalizeBrokerKey('Kite Connect')).toBe('ZERODHA');
    });

    it('normalizes Upstox variations', () => {
      expect(normalizeBrokerKey('UPSTOX')).toBe('UPSTOX');
      expect(normalizeBrokerKey('upstox')).toBe('UPSTOX');
      expect(normalizeBrokerKey('Upstox Pro')).toBe('UPSTOX');
    });

    it('normalizes Angel One variations', () => {
      expect(normalizeBrokerKey('ANGEL_ONE')).toBe('ANGEL_ONE');
      expect(normalizeBrokerKey('angelone')).toBe('ANGEL_ONE');
      expect(normalizeBrokerKey('Angel One')).toBe('ANGEL_ONE');
    });
  });

  describe('getBrokerTabGroups (Strict User Directive)', () => {
    it('CRITICAL: returns empty array in "ALL" demats (tab bar must be hidden!)', () => {
      const groups = getBrokerTabGroups('ALL');
      expect(groups).toEqual([]);
    });

    it('includes MUTUAL FUNDS group for Zerodha', () => {
      const groups = getBrokerTabGroups('ZERODHA', { holdings: 6, orders: 3 });
      const labels = groups.map(g => g.groupLabel);
      expect(labels).toContain('EQUITY');
      expect(labels).toContain('ACTIVITY');
      expect(labels).toContain('MUTUAL FUNDS');
      expect(labels).toContain('ACCOUNT');

      const mfGroup = groups.find(g => g.groupLabel === 'MUTUAL FUNDS');
      expect(mfGroup.tabs.map(t => t.id)).toEqual([
        'mf-holdings',
        'mf-orders',
        'mf-sips',
        'mf-timeline',
        'mf-instruments',
      ]);
    });

    it('CRITICAL: completely omits MUTUAL FUNDS group for Upstox', () => {
      const groups = getBrokerTabGroups('UPSTOX');
      const labels = groups.map(g => g.groupLabel);
      expect(labels).toContain('EQUITY');
      expect(labels).toContain('ACTIVITY');
      expect(labels).toContain('ACCOUNT');
      expect(labels).not.toContain('MUTUAL FUNDS');
    });

    it('CRITICAL: completely omits MUTUAL FUNDS group for Angel One', () => {
      const groups = getBrokerTabGroups('ANGEL_ONE');
      const labels = groups.map(g => g.groupLabel);
      expect(labels).toContain('EQUITY');
      expect(labels).toContain('ACTIVITY');
      expect(labels).toContain('ACCOUNT');
      expect(labels).not.toContain('MUTUAL FUNDS');
    });
  });

  describe('formatBoid', () => {
    it('formats 16-digit CDSL Demat BOIDs with standard mid-dot grouping', () => {
      expect(formatBoid('1208160002941021')).toBe('12081600 · 02941021');
      expect(formatBoid(' 1208180004928172 ')).toBe('12081800 · 04928172');
    });

    it('preserves clean string if not 16 digits and returns null if empty', () => {
      expect(formatBoid(null)).toBeNull();
      expect(formatBoid('')).toBeNull();
      expect(formatBoid('ZK8942')).toBe('ZK8942');
    });
  });

  describe('BROKER_CONFIGS', () => {
    it('has complete configuration for Zerodha, Upstox, Angel One', () => {
      expect(BROKER_CONFIGS.ZERODHA.supportsMf).toBe(true);
      expect(BROKER_CONFIGS.UPSTOX.supportsMf).toBe(false);
      expect(BROKER_CONFIGS.ANGEL_ONE.supportsMf).toBe(false);
      expect(BROKER_FILTER_PILLS.length).toBe(4);
    });
  });
});
