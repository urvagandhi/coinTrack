'use client';

import { portfolioAPI } from '@/shared/api/client';
import { useQuery } from '@tanstack/react-query';
import MfSipList from './MfSipList';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfSipsTab({ navigateTo, context }) {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', 'mf-sips'],
    queryFn: portfolioAPI.getMfSips,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <TabLoadingSkeleton rows={5} showKpis={true} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  const sips = rawData?.data || [];
  const unlinkedOrders = rawData?.unlinkedSipOrders || [];

  const handleNavigate = (targetTab, navContext) => {
    if (navigateTo) {
      const tabMap = { timeline: 'mf-timeline', mf_sips: 'mf-sips' };
      navigateTo(tabMap[targetTab] || targetTab, navContext);
    }
  };

  return (
    <MfSipList
      sips={sips}
      unlinkedOrders={unlinkedOrders}
      isLoading={false}
      onNavigate={handleNavigate}
      initialContext={context}
    />
  );
}

export default MfSipsTab;
