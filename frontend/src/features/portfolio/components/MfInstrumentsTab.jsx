'use client';

import { portfolioAPI } from '@/shared/api/client';
import { useQuery } from '@tanstack/react-query';
import MfInstrumentList from './MfInstrumentList';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfInstrumentsTab() {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', 'mf-instruments'],
    queryFn: portfolioAPI.getMfInstruments,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <TabLoadingSkeleton rows={6} showKpis={true} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  const instruments = Array.isArray(rawData) ? rawData : rawData?.data || [];

  return <MfInstrumentList instruments={instruments} isLoading={false} />;
}

export default MfInstrumentsTab;
