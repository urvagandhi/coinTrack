/**
 * Framer Motion variants library — single source of truth for all animations.
 * Components import from here; never define inline variants.
 */

// ── Page transitions ────────────────────────────────────────────

export const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ── Card entrance (staggered children) ──────────────────────────

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
};

// ── Sidebar (slide from left) ───────────────────────────────────

export const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
    closed: { x: -16, opacity: 0, transition: { duration: 0.2 } },
};

// ── Modal / overlay ─────────────────────────────────────────────

export const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 8 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        y: 4,
        transition: { duration: 0.15 },
    },
};

export const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ── Drawer (slide from right or bottom) ─────────────────────────

export const drawerVariants = {
    right: {
        hidden: { x: '100%', opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
        exit: { x: '100%', opacity: 0, transition: { duration: 0.22 } },
    },
    bottom: {
        hidden: { y: '100%', opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
        exit: { y: '100%', opacity: 0, transition: { duration: 0.22 } },
    },
};

// ── Stat number entrance ────────────────────────────────────────

export const numberVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Toast notification ──────────────────────────────────────────

export const toastVariants = {
    initial: { opacity: 0, x: 48, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: 48, scale: 0.95, transition: { duration: 0.18 } },
};

// ── Table row stagger ───────────────────────────────────────────

export const tableRowVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.04, duration: 0.25, ease: 'easeOut' },
    }),
};

// ── Skeleton pulse ──────────────────────────────────────────────

export const skeletonVariants = {
    pulse: {
        opacity: [1, 0.4, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
};

// ── P&L value change flash ──────────────────────────────────────

export const pnlFlashVariants = {
    positive: {
        color: ['hsl(var(--pnl-positive))', 'hsl(var(--foreground))'],
        transition: { duration: 0.8 },
    },
    negative: {
        color: ['hsl(var(--pnl-negative))', 'hsl(var(--foreground))'],
        transition: { duration: 0.8 },
    },
};

// ── Accordion / collapsible ─────────────────────────────────────

export const accordionVariants = {
    open: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
    closed: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};

// ── Reduced motion utilities ────────────────────────────────────

export const shouldReduceMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Returns static variants (no animation) if user prefers reduced motion.
 * Usage: const variants = useMotionVariants(pageVariants)
 */
export const useMotionVariants = (variants) => {
    if (shouldReduceMotion()) {
        return { initial: {}, animate: {}, exit: {} };
    }
    return variants;
};
