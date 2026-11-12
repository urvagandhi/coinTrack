import {
  formatTagLabel,
  getDeletedCustomTypeIds,
  getNoteCategory,
  getNoteTypeInfo,
  markCustomTypeDeleted,
  relativeTime,
  unmarkCustomTypeDeleted,
} from '../constants';

describe('Notes Advanced Edge Cases & Precedence Rules', () => {
  describe('Category Inference Precedence Hierarchy', () => {
    it('prioritizes explicit type:<custom> tag over conflicting title prefixes and colors', () => {
      // Note has a thesis prefix AND rose (lesson) color, but explicit type:dividend tag
      const note = {
        title: 'Thesis: High dividend yield portfolio',
        color: 'bg-rose-50',
        tags: ['type:dividend', 'income'],
      };
      const typeInfo = getNoteTypeInfo(note);
      expect(typeInfo.id).toBe('dividend');
      expect(typeInfo.label).toBe('Dividend');
      expect(typeInfo.isCustom).toBe(true);
    });

    it('prioritizes explicit type:<preset> tag over conflicting title prefixes and colors', () => {
      // Note has Idea title prefix, but explicit type:conviction tag
      const note = {
        title: 'Idea: Buying more shares',
        color: 'bg-emerald-50',
        tags: ['type:conviction'],
      };
      const typeInfo = getNoteTypeInfo(note);
      expect(typeInfo.id).toBe('conviction');
      expect(typeInfo.label).toBe('Why I bought');
      expect(typeInfo.isCustom).toBe(false);
    });

    it('prioritizes content tags over title prefixes and color strings', () => {
      // Title says Idea, color says blue (conviction), but tags contain 'market-thoughts'
      const note = {
        title: 'Idea: Market consolidation',
        color: 'bg-blue-50',
        tags: ['market-thoughts', 'nifty'],
      };
      expect(getNoteCategory(note)).toBe('thought');
    });

    it('prioritizes color over title prefix when no category tags are present', () => {
      // Title prefix suggests Idea, but color explicitly set to rose (lesson)
      const note = {
        title: 'Idea: Stop loss hit',
        color: 'bg-rose-50',
        tags: ['stocks'],
      };
      expect(getNoteCategory(note)).toBe('lesson');
    });

    it('resolves via title prefix when color is default slate and no tags are present', () => {
      expect(
        getNoteCategory({
          title: 'Why I bought: Titan Company',
          color: 'slate',
          tags: [],
        })
      ).toBe('conviction');

      expect(
        getNoteCategory({
          title: '[Lesson] Overleveraging in derivatives',
          color: 'slate',
          tags: [],
        })
      ).toBe('lesson');

      expect(
        getNoteCategory({
          title: 'Thesis: Semiconductor cycle turnaround',
          color: 'slate',
          tags: [],
        })
      ).toBe('conviction');
    });

    it('falls back to general when no signals are provided', () => {
      expect(
        getNoteCategory({
          title: 'Random musings on compounding',
          color: 'slate',
          tags: ['personal', 'finance'],
        })
      ).toBe('general');
    });
  });

  describe('Complex Title Prefix Parsing', () => {
    it('handles various brackets, punctuation, and mixed casing in title prefixes', () => {
      expect(getNoteCategory({ title: '[why i bought]: HDFC Bank' })).toBe(
        'conviction'
      );
      expect(getNoteCategory({ title: 'why i bought: ITC Limited' })).toBe(
        'conviction'
      );
      expect(getNoteCategory({ title: 'THESIS: Consumer staples' })).toBe(
        'conviction'
      );
      expect(getNoteCategory({ title: '[thought]: Rate cut impact' })).toBe(
        'thought'
      );
      expect(getNoteCategory({ title: '[observation]: FII flows' })).toBe(
        'thought'
      );
      expect(getNoteCategory({ title: '[LESSON]: Position sizing' })).toBe(
        'lesson'
      );
      expect(getNoteCategory({ title: 'IDEA: Renewable energy rally' })).toBe(
        'idea'
      );
    });

    it('handles leading and trailing whitespace around prefixes', () => {
      expect(
        getNoteCategory({ title: '   Idea: Clean tech expansion   ' })
      ).toBe('idea');
      expect(getNoteCategory({ title: '\t[Lesson] Avoid FOMO buying\n' })).toBe(
        'lesson'
      );
    });
  });

  describe('Custom Type Slugification & Labeling', () => {
    const slugifyType = input => {
      return (input || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };

    it('cleans complex user strings with punctuation and symbols into standard slugs', () => {
      expect(slugifyType('Crypto & NFTs!')).toBe('crypto-nfts');
      expect(slugifyType('AI / Machine Learning (2026)')).toBe(
        'ai-machine-learning-2026'
      );
      expect(slugifyType('---High--Growth---')).toBe('high-growth');
      expect(slugifyType('Real_Estate_REITs')).toBe('real_estate_reits');
    });

    it('formats slugs into human-friendly Title Case labels', () => {
      expect(formatTagLabel('crypto-nfts')).toBe('Crypto Nfts');
      expect(formatTagLabel('ai-machine-learning-2026')).toBe(
        'Ai Machine Learning 2026'
      );
      expect(formatTagLabel('real_estate_reits')).toBe('Real Estate Reits');
      expect(formatTagLabel('dividend-yield')).toBe('Dividend Yield');
    });
  });

  describe('Multi-Tenant User Partitioning & Storage Resilience', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('isolates custom type blacklists between different users', () => {
      const userA = 'user_alpha';
      const userB = 'user_beta';

      markCustomTypeDeleted('crypto', userA);

      expect(getDeletedCustomTypeIds(userA)).toContain('crypto');
      expect(getDeletedCustomTypeIds(userB)).not.toContain('crypto');

      // User A unmarks
      unmarkCustomTypeDeleted('crypto', userA);
      expect(getDeletedCustomTypeIds(userA)).not.toContain('crypto');
    });

    it('recovers gracefully when localStorage holds corrupted JSON', () => {
      const userId = 'corrupt_user';
      localStorage.setItem(
        `cointrack_deleted_custom_types_${userId}`,
        '{invalid-json'
      );

      expect(() => getDeletedCustomTypeIds(userId)).not.toThrow();
      expect(getDeletedCustomTypeIds(userId)).toEqual([]);
    });

    it('ignores deleted custom types in getNoteTypeInfo', () => {
      const userId = 'user_123';
      markCustomTypeDeleted('crypto', userId);

      // Note has type:crypto
      const note = { tags: ['type:crypto'] };
      const info = getNoteTypeInfo(note, userId);

      // Because crypto is deleted for user_123, it shouldn't resolve as an active custom type
      expect(info.id).not.toBe('crypto');
    });
  });

  describe('Relative Time Boundary Calculations & Clock Skew Resilience', () => {
    it('returns "Just now" for current or future timestamps (client-server clock skew)', () => {
      const now = new Date().toISOString();
      expect(relativeTime(now)).toBe('Just now');

      // 5 minutes in the future due to server clock drift
      const future = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      expect(relativeTime(future)).toBe('Just now');
    });

    it('formats minutes, hours, days, months, and years cleanly', () => {
      const now = Date.now();

      const twoMinutesAgo = new Date(now - 2 * 60 * 1000).toISOString();
      expect(relativeTime(twoMinutesAgo)).toBe('2m ago');

      const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
      expect(relativeTime(oneHourAgo)).toBe('1h ago');

      const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000).toISOString();
      expect(relativeTime(threeHoursAgo)).toBe('3h ago');

      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTime(oneDayAgo)).toBe('Yesterday');

      const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(relativeTime(fiveDaysAgo)).toBe('5d ago');

      const twoMonthsAgo = new Date(
        now - 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      expect(relativeTime(twoMonthsAgo)).toBe('2 months ago');

      const twoYearsAgo = new Date(
        now - 730 * 24 * 60 * 60 * 1000
      ).toISOString();
      expect(relativeTime(twoYearsAgo)).toBe('2 years ago');
    });

    it('returns empty string for null or empty, and Just now for invalid or future dates', () => {
      expect(relativeTime(null)).toBe('');
      expect(relativeTime('')).toBe('');
      expect(relativeTime(undefined)).toBe('');
      expect(relativeTime('invalid-date')).toBe('Just now');
    });
  });

  describe('Tags Filtering & System Tag Isolation', () => {
    it('extracts user content tags while stripping internal system type tags', () => {
      const rawNotes = [
        { tags: ['type:crypto', 'stocks', 'midcap', 'thesis'] },
        { tags: ['type:idea', 'dividends', 'macro', 'conviction'] },
        { tags: ['type:thought', 'stocks', 'largecap', 'market-thoughts'] },
      ];

      const tagSet = new Set();
      const internalTags = [
        'thesis',
        'why-i-bought',
        'reasons-to-buy',
        'conviction',
        'observation',
        'observations',
        'market-thoughts',
        'thought',
        'idea',
        'ideas',
        'watchlist',
        'errata',
        'lesson',
        'lessons',
        'general',
      ];

      rawNotes.forEach(n => {
        (n.tags || []).forEach(t => {
          const clean = String(t).toLowerCase().trim();
          if (clean.startsWith('type:')) return;
          if (!internalTags.includes(clean)) {
            tagSet.add(clean);
          }
        });
      });

      const extracted = Array.from(tagSet);
      expect(extracted).toContain('stocks');
      expect(extracted).toContain('midcap');
      expect(extracted).toContain('dividends');
      expect(extracted).toContain('macro');
      expect(extracted).toContain('largecap');

      // None of the internal system tags or type:* tags should leak
      expect(extracted).not.toContain('type:crypto');
      expect(extracted).not.toContain('thesis');
      expect(extracted).not.toContain('conviction');
      expect(extracted).not.toContain('market-thoughts');
    });
  });
});
