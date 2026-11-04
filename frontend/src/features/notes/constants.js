'use client';

import {
  AlertCircle,
  Eye,
  FileText,
  Lightbulb,
  Tag,
  Target,
} from 'lucide-react';

/**
 * Human-friendly note categories designed for beginners and seasoned investors alike.
 * Simple, calm, free of academic jargon.
 */
export const NOTE_CATEGORIES = {
  idea: {
    id: 'idea',
    label: 'Idea',
    plural: 'Ideas',
    icon: Lightbulb,
    badgeClass:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-700/80',
    colorKey: 'emerald',
    description: 'Stocks or funds you want to research or buy',
  },
  conviction: {
    id: 'conviction',
    label: 'Why I bought',
    plural: 'Why I bought',
    icon: Target,
    badgeClass:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-700/80',
    colorKey: 'blue',
    description: 'Your reasons, target price, and plan for this investment',
  },
  thought: {
    id: 'thought',
    label: 'Market thoughts',
    plural: 'Market thoughts',
    icon: Eye,
    badgeClass:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-700/80',
    colorKey: 'amber',
    description: 'What you noticed about the market, economy, or news',
  },
  lesson: {
    id: 'lesson',
    label: 'Lessons learned',
    plural: 'Lessons',
    icon: AlertCircle,
    badgeClass:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-700/80',
    colorKey: 'rose',
    description: 'Mistakes made and rules to remember next time',
  },
  general: {
    id: 'general',
    label: 'General',
    plural: 'General',
    icon: FileText,
    badgeClass:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-700/80',
    colorKey: 'slate',
    description: 'General notes and thoughts',
  },
};

/**
 * Calm, deliberate accent colors following Unslop design principles:
 * Neutral surfaces (white / dark graphite), NO pastel washes or neon glows.
 * Color serves as a quiet status dot.
 */
export const NOTE_COLORS = [
  {
    key: 'slate',
    name: 'Default',
    hex: '#64748b',
    bgClass: 'bg-slate-50',
    cardClass:
      'bg-white dark:bg-[#16171a] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-800',
    badgeClass:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200/70 dark:border-neutral-700/70',
    dotClass: 'bg-neutral-400 dark:bg-neutral-500',
  },
  {
    key: 'blue',
    name: 'Blue',
    hex: '#2563eb',
    bgClass: 'bg-blue-50',
    cardClass:
      'bg-white dark:bg-[#16171a] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-800',
    badgeClass:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200/70 dark:border-neutral-700/70',
    dotClass: 'bg-blue-500',
  },
  {
    key: 'emerald',
    name: 'Green',
    hex: '#059669',
    bgClass: 'bg-emerald-50',
    cardClass:
      'bg-white dark:bg-[#16171a] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-800',
    badgeClass:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200/70 dark:border-neutral-700/70',
    dotClass: 'bg-emerald-500',
  },
  {
    key: 'amber',
    name: 'Amber',
    hex: '#d97706',
    bgClass: 'bg-amber-50',
    cardClass:
      'bg-white dark:bg-[#16171a] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-800',
    badgeClass:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200/70 dark:border-neutral-700/70',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'rose',
    name: 'Rose',
    hex: '#e11d48',
    bgClass: 'bg-rose-50',
    cardClass:
      'bg-white dark:bg-[#16171a] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-800',
    badgeClass:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200/70 dark:border-neutral-700/70',
    dotClass: 'bg-rose-500',
  },
  {
    key: 'purple',
    name: 'Purple',
    hex: '#8b5cf6',
    bgClass: 'bg-purple-50',
    cardClass:
      'bg-white dark:bg-[#16171a] border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-800',
    badgeClass:
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200/70 dark:border-neutral-700/70',
    dotClass: 'bg-purple-500',
  },
];

export const SUGGESTED_TAGS = [
  'stocks',
  'mutual-funds',
  'watchlist',
  'banking',
  'tech',
  'long-term',
  'dividend',
  'earnings',
];

/**
 * Storage helpers for custom types & deleted types blacklist, safely partitioned per user.
 */
export function getDeletedCustomTypeIds(userId = 'default') {
  if (typeof window === 'undefined') return [];
  try {
    const key = `cointrack_deleted_custom_types_${userId}`;
    const raw =
      localStorage.getItem(key) ||
      localStorage.getItem('cointrack_deleted_custom_types');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markCustomTypeDeleted(id, userId = 'default') {
  if (!id || typeof window === 'undefined') return;
  try {
    const list = getDeletedCustomTypeIds(userId);
    const cleanId = String(id).toLowerCase().trim();
    if (!list.includes(cleanId)) {
      const key = `cointrack_deleted_custom_types_${userId}`;
      localStorage.setItem(key, JSON.stringify([...list, cleanId]));
    }
  } catch {}
}

export function unmarkCustomTypeDeleted(id, userId = 'default') {
  if (!id || typeof window === 'undefined') return;
  try {
    const list = getDeletedCustomTypeIds(userId);
    const cleanId = String(id).toLowerCase().trim();
    const filtered = list.filter(item => item !== cleanId);
    const key = `cointrack_deleted_custom_types_${userId}`;
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}
}

/**
 * Robust helper to resolve any color key, hex, or Tailwind color string
 */
export function getNoteColor(colorStr) {
  if (!colorStr) return NOTE_COLORS.find(c => c.key === 'slate');
  const str = String(colorStr).toLowerCase().trim();

  // 1. Direct match on key or hex
  for (const c of NOTE_COLORS) {
    if (str === c.key || str === c.hex.toLowerCase() || str.includes(c.key)) {
      return c;
    }
  }

  // 2. Synonyms and Tailwind color tokens
  if (
    str.includes('amber') ||
    str.includes('orange') ||
    str.includes('yellow')
  ) {
    return NOTE_COLORS.find(c => c.key === 'amber');
  }
  if (
    str.includes('emerald') ||
    str.includes('green') ||
    str.includes('lime') ||
    str.includes('teal')
  ) {
    return NOTE_COLORS.find(c => c.key === 'emerald');
  }
  if (
    str.includes('blue') ||
    str.includes('cyan') ||
    str.includes('sky') ||
    str.includes('indigo')
  ) {
    return NOTE_COLORS.find(c => c.key === 'blue');
  }
  if (
    str.includes('rose') ||
    str.includes('red') ||
    str.includes('pink') ||
    str.includes('fuchsia')
  ) {
    return NOTE_COLORS.find(c => c.key === 'rose');
  }
  if (str.includes('purple') || str.includes('violet')) {
    return NOTE_COLORS.find(c => c.key === 'purple');
  }

  return NOTE_COLORS.find(c => c.key === 'slate');
}

/**
 * Convert a tag string into a readable label (e.g. 'crypto-market' -> 'Crypto Market')
 */
export function formatTagLabel(tag) {
  if (!tag) return '';
  return tag
    .replace(/^type:/i, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Comprehensive note type inspector supporting:
 * 1. Dedicated `type:<name>` tags (e.g. `type:crypto` -> 'Crypto')
 * 2. Standard preset category tags ('ideas', 'why-i-bought', 'market-thoughts', 'lessons')
 * 3. Legacy tags ('thesis', 'observation', 'errata')
 * 4. User-created custom types (excluding deleted ones)
 */
export function getNoteTypeInfo(note, userId = 'default') {
  if (!note) {
    return {
      id: 'general',
      label: 'General',
      isCustom: false,
      icon: FileText,
    };
  }

  const tags = (note.tags || []).map(t => String(t).trim());
  const lowerTags = tags.map(t => t.toLowerCase());
  const deletedIds = getDeletedCustomTypeIds(userId);

  // 1. Explicit `type:...` prefix tag takes highest priority
  for (const tag of tags) {
    if (tag.toLowerCase().startsWith('type:')) {
      const typeKey = tag.slice(5).trim();
      const lowerKey = typeKey.toLowerCase();

      // Check if it's one of the known presets
      if (NOTE_CATEGORIES[lowerKey]) {
        return {
          id: lowerKey,
          label: NOTE_CATEGORIES[lowerKey].label,
          isCustom: false,
          icon: NOTE_CATEGORIES[lowerKey].icon,
        };
      }

      // Check if user has explicitly deleted this custom type
      if (deletedIds.includes(lowerKey)) {
        continue;
      }

      // It's an active custom user label!
      return {
        id: lowerKey,
        label: formatTagLabel(typeKey),
        isCustom: true,
        icon: Tag,
      };
    }
  }

  // 2. Preset tag match
  if (
    lowerTags.includes('idea') ||
    lowerTags.includes('ideas') ||
    lowerTags.includes('watchlist')
  ) {
    return {
      id: 'idea',
      label: NOTE_CATEGORIES.idea.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.idea.icon,
    };
  }
  if (
    lowerTags.includes('conviction') ||
    lowerTags.includes('why-i-bought') ||
    lowerTags.includes('reasons-to-buy') ||
    lowerTags.includes('thesis')
  ) {
    return {
      id: 'conviction',
      label: NOTE_CATEGORIES.conviction.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.conviction.icon,
    };
  }
  if (
    lowerTags.includes('thought') ||
    lowerTags.includes('market-thoughts') ||
    lowerTags.includes('observation') ||
    lowerTags.includes('observations')
  ) {
    return {
      id: 'thought',
      label: NOTE_CATEGORIES.thought.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.thought.icon,
    };
  }
  if (
    lowerTags.includes('lesson') ||
    lowerTags.includes('lessons') ||
    lowerTags.includes('lessons-learned') ||
    lowerTags.includes('errata')
  ) {
    return {
      id: 'lesson',
      label: NOTE_CATEGORIES.lesson.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.lesson.icon,
    };
  }

  // 3. Color fallback for legacy notes
  const colorStr = String(note.color || '').toLowerCase();
  if (colorStr.includes('blue') || colorStr.includes('cyan')) {
    return {
      id: 'conviction',
      label: NOTE_CATEGORIES.conviction.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.conviction.icon,
    };
  }
  if (
    colorStr.includes('emerald') ||
    colorStr.includes('lime') ||
    colorStr.includes('green')
  ) {
    return {
      id: 'idea',
      label: NOTE_CATEGORIES.idea.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.idea.icon,
    };
  }
  if (
    colorStr.includes('amber') ||
    colorStr.includes('orange') ||
    colorStr.includes('yellow')
  ) {
    return {
      id: 'thought',
      label: NOTE_CATEGORIES.thought.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.thought.icon,
    };
  }
  if (
    colorStr.includes('rose') ||
    colorStr.includes('red') ||
    colorStr.includes('fuchsia')
  ) {
    return {
      id: 'lesson',
      label: NOTE_CATEGORIES.lesson.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.lesson.icon,
    };
  }

  // 4. Title / content prefix scan
  const text =
    `${(note.title || '').trim()} ${(note.content || '').trim()}`.toLowerCase();
  if (text.includes('[idea]') || text.startsWith('idea:')) {
    return {
      id: 'idea',
      label: NOTE_CATEGORIES.idea.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.idea.icon,
    };
  }
  if (
    text.includes('[why i bought]') ||
    text.includes('[thesis]') ||
    text.startsWith('why i bought:') ||
    text.startsWith('thesis:')
  ) {
    return {
      id: 'conviction',
      label: NOTE_CATEGORIES.conviction.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.conviction.icon,
    };
  }
  if (
    text.includes('[thought]') ||
    text.includes('[observation]') ||
    text.startsWith('thought:') ||
    text.startsWith('observation:')
  ) {
    return {
      id: 'thought',
      label: NOTE_CATEGORIES.thought.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.thought.icon,
    };
  }
  if (
    text.includes('[lesson]') ||
    text.includes('[errata]') ||
    text.startsWith('lesson:') ||
    text.startsWith('errata:')
  ) {
    return {
      id: 'lesson',
      label: NOTE_CATEGORIES.lesson.label,
      isCustom: false,
      icon: NOTE_CATEGORIES.lesson.icon,
    };
  }

  return {
    id: 'general',
    label: NOTE_CATEGORIES.general.label,
    isCustom: false,
    icon: NOTE_CATEGORIES.general.icon,
  };
}

/**
 * Legacy category key helper, preserved for backward compatibility.
 */
export function getNoteCategory(note) {
  return getNoteTypeInfo(note).id;
}

/**
 * Human-friendly relative time in standard sentence case (no weird monospace numbers).
 */
export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return 'Just now';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}
