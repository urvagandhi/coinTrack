// Canonical Sonner adapter — standardizes toasts across the application.
'use client';

import { toast as sonner } from 'sonner';

export const toast = (props, maybeOptions) => {
  if (typeof props === 'string') {
    return sonner(props, maybeOptions);
  }
  const { title, description, variant, duration, ...opts } = props || {};
  const options = { description, duration, ...opts };

  if (variant === 'destructive') {
    return sonner.error(title || 'Error', options);
  }
  if (variant === 'success') {
    return sonner.success(title || 'Success', options);
  }
  return sonner(title, options);
};

export function useToast() {
  return {
    toast,
    dismiss: sonner.dismiss,
    toasts: [],
  };
}

export default useToast;
