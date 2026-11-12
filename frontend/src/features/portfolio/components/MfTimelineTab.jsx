'use client';

import { portfolioAPI } from '@/shared/api/client';
import { useQuery } from '@tanstack/react-query';
import MfTimeline from './MfTimeline';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfTimelineTab({ selectedBroker = 'ZERODHA' }) {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', 'mf-timeline'],
    queryFn: portfolioAPI.getMfTimeline,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <TabLoadingSkeleton rows={4} showKpis={false} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  const events = Array.isArray(rawData) ? rawData : rawData?.data || [];

  return <MfTimeline events={events} selectedBroker={selectedBroker} />;
}

export default MfTimelineTab;
