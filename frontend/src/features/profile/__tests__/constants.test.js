import {
  CURRENCY_OPTIONS,
  NOTIF_LABELS,
  SETTINGS_TABS,
  THEME_OPTIONS,
} from '../constants';

describe('Profile Constants and Configuration', () => {
  describe('SETTINGS_TABS', () => {
    it('defines all required settings tabs in correct order', () => {
      const expectedTabs = [
        'profile',
        'security',
        'preferences',
        'notifications',
        'danger',
      ];
      expect(SETTINGS_TABS.map(t => t.id)).toEqual(expectedTabs);
    });

    it('ensures each tab has a valid human-friendly label and icon component', () => {
      SETTINGS_TABS.forEach(tab => {
        expect(typeof tab.id).toBe('string');
        expect(tab.id.trim()).not.toBe('');
        expect(typeof tab.label).toBe('string');
        expect(tab.label.trim()).not.toBe('');
        expect(typeof tab.icon).toBe('object'); // Lucide React icon element
      });
    });

    it('has unique tab IDs with zero collisions', () => {
      const ids = SETTINGS_TABS.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('NOTIF_LABELS', () => {
    it('contains all 4 granular notification types with title and body', () => {
      const requiredTypes = [
        'priceAlerts',
        'portfolioUpdates',
        'marketNews',
        'weeklyReports',
      ];
      requiredTypes.forEach(type => {
        expect(NOTIF_LABELS[type]).toBeDefined();
        expect(NOTIF_LABELS[type].title).toBeTruthy();
        expect(NOTIF_LABELS[type].body).toBeTruthy();
      });
    });
  });

  describe('THEME_OPTIONS', () => {
    it('supports light, dark, and system themes with icons', () => {
      const ids = THEME_OPTIONS.map(t => t.id);
      expect(ids).toEqual(['light', 'dark', 'system']);
      THEME_OPTIONS.forEach(opt => {
        expect(opt.label).toBeTruthy();
        expect(opt.icon).toBeDefined();
      });
    });
  });

  describe('CURRENCY_OPTIONS', () => {
    it('contains valid ISO currency codes with symbols and labels', () => {
      const codes = CURRENCY_OPTIONS.map(c => c.code);
      expect(codes).toEqual(['INR', 'USD', 'EUR', 'GBP']);

      const inr = CURRENCY_OPTIONS.find(c => c.code === 'INR');
      expect(inr.symbol).toBe('₹');
      expect(inr.label).toBe('Indian Rupee');

      const usd = CURRENCY_OPTIONS.find(c => c.code === 'USD');
      expect(usd.symbol).toBe('$');

      const eur = CURRENCY_OPTIONS.find(c => c.code === 'EUR');
      expect(eur.symbol).toBe('€');

      const gbp = CURRENCY_OPTIONS.find(c => c.code === 'GBP');
      expect(gbp.symbol).toBe('£');
    });
  });
});
