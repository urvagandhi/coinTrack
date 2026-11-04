import {
  NOTE_CATEGORIES,
  NOTE_COLORS,
  formatTagLabel,
  getDeletedCustomTypeIds,
  getNoteCategory,
  getNoteColor,
  getNoteTypeInfo,
  markCustomTypeDeleted,
  relativeTime,
  unmarkCustomTypeDeleted,
} from '../constants';

describe('Notes Constants and Helpers', () => {
  describe('getNoteCategory and getNoteTypeInfo', () => {
    it('returns general for null or undefined note', () => {
      expect(getNoteCategory(null)).toBe('general');
      expect(getNoteCategory({})).toBe('general');
      expect(getNoteTypeInfo(null).id).toBe('general');
    });

    it('identifies custom types with type: prefix', () => {
      const cryptoInfo = getNoteTypeInfo({ tags: ['type:crypto', 'stocks'] });
      expect(cryptoInfo.id).toBe('crypto');
      expect(cryptoInfo.label).toBe('Crypto');
      expect(cryptoInfo.isCustom).toBe(true);

      const multiWordInfo = getNoteTypeInfo({ tags: ['type:real-estate'] });
      expect(multiWordInfo.id).toBe('real-estate');
      expect(multiWordInfo.label).toBe('Real Estate');
      expect(multiWordInfo.isCustom).toBe(true);
    });

    it('identifies standard presets with type: prefix as non-custom', () => {
      const ideaInfo = getNoteTypeInfo({ tags: ['type:idea'] });
      expect(ideaInfo.id).toBe('idea');
      expect(ideaInfo.label).toBe('Idea');
      expect(ideaInfo.isCustom).toBe(false);
    });

    it('identifies category from modern and legacy tags', () => {
      expect(getNoteCategory({ tags: ['why-i-bought'] })).toBe('conviction');
      expect(getNoteCategory({ tags: ['thesis', 'macro'] })).toBe('conviction');
      expect(getNoteCategory({ tags: ['market-thoughts'] })).toBe('thought');
      expect(getNoteCategory({ tags: ['OBSERVATION'] })).toBe('thought');
      expect(getNoteCategory({ tags: ['idea', 'stocks'] })).toBe('idea');
      expect(getNoteCategory({ tags: ['lessons-learned'] })).toBe('lesson');
      expect(getNoteCategory({ tags: ['errata'] })).toBe('lesson');
    });

    it('identifies category from color string', () => {
      expect(getNoteCategory({ color: 'bg-blue-50' })).toBe('conviction');
      expect(getNoteCategory({ color: 'bg-amber-50' })).toBe('thought');
      expect(getNoteCategory({ color: 'bg-emerald-50' })).toBe('idea');
      expect(getNoteCategory({ color: 'bg-rose-50' })).toBe('lesson');
    });

    it('identifies category from title prefix', () => {
      expect(getNoteCategory({ title: 'Why I bought: HDFC Bank' })).toBe(
        'conviction'
      );
      expect(getNoteCategory({ title: 'Thesis: HDFC Bank growth' })).toBe(
        'conviction'
      );
      expect(getNoteCategory({ title: '[Thought] Market breadth' })).toBe(
        'thought'
      );
      expect(getNoteCategory({ title: 'Idea: Short term gold hedge' })).toBe(
        'idea'
      );
      expect(getNoteCategory({ title: '[Lesson] Early exit on IT' })).toBe(
        'lesson'
      );
    });
  });

  describe('formatTagLabel', () => {
    it('formats kebab-case into Title Case', () => {
      expect(formatTagLabel('crypto-market')).toBe('Crypto Market');
      expect(formatTagLabel('type:dividends')).toBe('Dividends');
      expect(formatTagLabel('long_term_growth')).toBe('Long Term Growth');
    });
  });

  describe('getNoteColor', () => {
    it('returns default slate for null or unknown color', () => {
      expect(getNoteColor(null).key).toBe('slate');
      expect(getNoteColor('unknown-color').key).toBe('slate');
    });

    it('identifies color definition from color string', () => {
      expect(getNoteColor('bg-blue-50').key).toBe('blue');
      expect(getNoteColor('bg-amber-50').key).toBe('amber');
      expect(getNoteColor('bg-emerald-50').key).toBe('emerald');
      expect(getNoteColor('bg-rose-50').key).toBe('rose');
      expect(getNoteColor('bg-purple-50').key).toBe('purple');
    });

    it('resolves color synonyms correctly (e.g. orange, green, red)', () => {
      expect(getNoteColor('bg-orange-50').key).toBe('amber');
      expect(getNoteColor('orange').key).toBe('amber');
      expect(getNoteColor('yellow').key).toBe('amber');
      expect(getNoteColor('bg-green-50').key).toBe('emerald');
      expect(getNoteColor('green').key).toBe('emerald');
      expect(getNoteColor('bg-red-50').key).toBe('rose');
      expect(getNoteColor('red').key).toBe('rose');
      expect(getNoteColor('pink').key).toBe('rose');
    });

    it('provides cardClass and accentBorder for each color', () => {
      NOTE_COLORS.forEach(c => {
        expect(c.cardClass).toBeDefined();
        expect(c.accentBorder).toBeDefined();
      });
    });
  });

  describe('relativeTime', () => {
    it('returns empty string for null or empty string', () => {
      expect(relativeTime(null)).toBe('');
      expect(relativeTime('')).toBe('');
    });

    it('returns "Just now" for recent timestamp', () => {
      const now = new Date().toISOString();
      expect(relativeTime(now)).toBe('Just now');
    });

    it('formats past dates in human-readable plain text', () => {
      const threeMonthsAgo = new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000
      ).toISOString();
      expect(relativeTime(threeMonthsAgo)).toBe('3 months ago');
    });
  });

  describe('NOTE_CATEGORIES structure', () => {
    it('contains all simple human-friendly category definitions', () => {
      expect(NOTE_CATEGORIES.idea).toBeDefined();
      expect(NOTE_CATEGORIES.conviction).toBeDefined();
      expect(NOTE_CATEGORIES.thought).toBeDefined();
      expect(NOTE_CATEGORIES.lesson).toBeDefined();
      expect(NOTE_CATEGORIES.general).toBeDefined();
    });
  });

  describe('Custom Type Deletion & Blacklist', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('marks a custom type as deleted and ignores it in getNoteTypeInfo', () => {
      markCustomTypeDeleted('crypto');
      expect(getDeletedCustomTypeIds()).toContain('crypto');

      const info = getNoteTypeInfo({ tags: ['type:crypto'] });
      expect(info.id).not.toBe('crypto');
    });

    it('unmarks a deleted custom type when recreated', () => {
      markCustomTypeDeleted('crypto');
      expect(getDeletedCustomTypeIds()).toContain('crypto');

      unmarkCustomTypeDeleted('crypto');
      expect(getDeletedCustomTypeIds()).not.toContain('crypto');

      const info = getNoteTypeInfo({ tags: ['type:crypto'] });
      expect(info.id).toBe('crypto');
      expect(info.isCustom).toBe(true);
    });
  });
});
