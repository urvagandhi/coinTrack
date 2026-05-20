// Thin Sonner adapter — preserves the legacy useToast() API so existing
// call sites keep working while toasts route through Sonner.
'use client';

import { toast as sonner } from 'sonner';

const dispatch = ({ title, description, variant, action, duration } = {}) => {
    const msg = title || description || '';
    const opts = {};
    if (title && description) opts.description = description;
    if (action) opts.action = action;
    if (duration) opts.duration = duration;

    switch (variant) {
        case 'destructive':
            return sonner.error(msg, opts);
        case 'success':
            return sonner.success(msg, opts);
        case 'warning':
            return sonner.warning(msg, opts);
        case 'info':
            return sonner.info(msg, opts);
        default:
            return sonner(msg, opts);
    }
};

export const toast = dispatch;

export function useToast() {
    return {
        toast: dispatch,
        dismiss: sonner.dismiss,
        toasts: [],
    };
}
