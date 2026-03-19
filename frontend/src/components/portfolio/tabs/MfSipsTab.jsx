// src/components/portfolio/tabs/MfSipsTab.jsx
'use client';

import MfSipList from '@/components/portfolio/MfSipList';
import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfSipsTab({ navigateTo, context }) {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'mf-sips'],
        queryFn: portfolioAPI.getMfSips,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    if (isLoading) return <TabLoadingSkeleton rows={5} columns={6} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    // getMfSips returns { data: SIP[], unlinkedSipOrders: Order[] }
    const sips = rawData?.data || [];
    const unlinkedOrders = rawData?.unlinkedSipOrders || [];

    const handleNavigate = (targetTab, navContext) => {
        if (navigateTo) {
            // Map old tab names to URL tab IDs
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
