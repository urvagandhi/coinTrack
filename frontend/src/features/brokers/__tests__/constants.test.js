import {
  BROKERS,
  BROKER_LIST,
  BROKER_SETTINGS_TABS,
  BROKER_BRAND_THEMES,
  BROKER_FILTER_TABS,
  getBrokerByKey,
  getBrokerById,
} from '../constants';

describe('Broker Subsystem Constants', () => {
  describe('BROKERS registry', () => {
    it('defines Zerodha, Upstox, and Angel One configurations', () => {
      expect(BROKERS.ZERODHA).toBeDefined();
      expect(BROKERS.UPSTOX).toBeDefined();
      expect(BROKERS.ANGEL_ONE).toBeDefined();
    });

    it('ensures every broker has key metadata properties', () => {
      BROKER_LIST.forEach(broker => {
        expect(broker.id).toBeTruthy();
        expect(broker.key).toBeTruthy();
        expect(broker.displayName).toBeTruthy();
        expect(broker.tagline).toBeTruthy();
        expect(broker.setupPath).toBeTruthy();
        expect(Array.isArray(broker.capabilities)).toBe(true);
        expect(broker.capabilities.length).toBeGreaterThan(0);
        expect(Array.isArray(broker.credentialFields)).toBe(true);
        expect(Array.isArray(broker.setupSteps)).toBe(true);
      });
    });

    it('getBrokerByKey resolves brokers correctly', () => {
      expect(getBrokerByKey('ZERODHA')?.displayName).toBe('Zerodha');
      expect(getBrokerByKey('UPSTOX')?.displayName).toBe('Upstox');
      expect(getBrokerByKey('ANGEL_ONE')?.displayName).toBe('Angel One');
      expect(getBrokerByKey('UNKNOWN')).toBeNull();
    });

    it('getBrokerById resolves brokers correctly', () => {
      expect(getBrokerById('zerodha')?.key).toBe('ZERODHA');
      expect(getBrokerById('upstox')?.key).toBe('UPSTOX');
      expect(getBrokerById('angelone')?.key).toBe('ANGEL_ONE');
      expect(getBrokerById('unknown')).toBeNull();
    });
  });

  describe('BROKER_SETTINGS_TABS', () => {
    it('defines the 3 core tabs: credentials, guide, hub', () => {
      const tabIds = BROKER_SETTINGS_TABS.map(t => t.id);
      expect(tabIds).toEqual(['credentials', 'guide', 'hub']);
    });

    it('ensures each tab has a valid label and icon', () => {
      BROKER_SETTINGS_TABS.forEach(tab => {
        expect(tab.label).toBeTruthy();
        expect(tab.icon).toBeDefined();
      });
    });
  });

  describe('BROKER_BRAND_THEMES', () => {
    it('defines branding tokens for all 3 brokers', () => {
      ['ZERODHA', 'UPSTOX', 'ANGEL_ONE'].forEach(key => {
        const theme = BROKER_BRAND_THEMES[key];
        expect(theme).toBeDefined();
        expect(theme.accentText).toBeTruthy();
        expect(theme.protocol).toBeTruthy();
      });
    });
  });

  describe('BROKER_FILTER_TABS', () => {
    it('defines All, Connected, Available directory filter tabs', () => {
      expect(BROKER_FILTER_TABS.map(t => t.id)).toEqual([
        'all',
        'connected',
        'available',
      ]);
    });
  });
});
