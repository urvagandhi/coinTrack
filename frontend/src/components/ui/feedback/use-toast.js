// Thin Sonner adapter — preserves the legacy useToast() API so existing
// call sites keep working while toasts route through Sonner.
'use client';

import { toast as sonner } from 'sonner';
import ToastCard from './toast-card';

const dispatch = ({ title, description, variant, action, duration } = {}) => {
  const opts = {};
  if (duration) opts.duration = duration;

  // We use sonner.custom to render our MAC-Style ToastCard.
  // sonner provides an 'id' or 't' (the toast object) to dismiss it.
  return sonner.custom(
    t => (
      <ToastCard
        title={title}
        description={description}
        variant={variant}
        action={action}
        onDismiss={() => sonner.dismiss(t)}
      />
    ),
    opts
  );
};

export const toast = dispatch;

export function useToast() {
  return {
    toast: dispatch,
    dismiss: sonner.dismiss,
    toasts: [],
  };
}
