'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { portfolioAPI } from '@/shared/api/client';
import { invalidateBrokerQueries } from './useBrokerConnection';

/**
 * Unified Broker & Market Feeds Sync Hook
 *
 * Provides a standardized sync trigger across CoinTrack with:
 * - Direct execution of portfolioAPI.manualRefresh()
 * - Standardized Sonner toast notification (bottom-right)
 * - Coordinated multi-domain query cache invalidation & active network refetch via invalidateBrokerQueries()
 * - Unified loading & spinning states
 * - Optional keyboard shortcut handling (⌘R / Ctrl+R) that prevents browser page reload
 */
export function useSyncFeeds({
  brokerDisplayName = null,
  successMessage = null,
  enableShortcut = false,
  onSuccess = null,
  onError = null,
} = {}) {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await portfolioAPI.manualRefresh();
      const message =
        successMessage ||
        (brokerDisplayName
          ? `${brokerDisplayName} holdings and positions synchronized`
          : 'Holdings and market feeds synchronized');
      toast.success(message);
      await invalidateBrokerQueries(queryClient);
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = err?.message || 'Sync failed';
      toast.error(errMsg);
      if (onError) onError(err);
    } finally {
      setIsSyncing(false);
    }
  }, [
    isSyncing,
    queryClient,
    brokerDisplayName,
    successMessage,
    onSuccess,
    onError,
  ]);

  // Optional ⌘R / Ctrl+R shortcut handling without browser page reload
  useEffect(() => {
    if (!enableShortcut) return;
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'r') {
        const target = e.target;
        const isInputField =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable;
        if (!isInputField) {
          e.preventDefault();
          sync();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut, sync]);

  return {
    sync,
    isSyncing,
  };
}
