// src/components/portfolio/tabs/MfTimelineTab.jsx
'use client';

import MfTimeline from '@/components/portfolio/MfTimeline';
import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfTimelineTab({ navigateTo, context }) {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'mf-timeline'],
        queryFn: portfolioAPI.getMfTimeline,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    if (isLoading) return <TabLoadingSkeleton rows={4} columns={4} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    const events = Array.isArray(rawData) ? rawData : (rawData?.data || []);

    const handleNavigate = (targetTab, navContext) => {
        if (navigateTo) {
            const tabMap = { timeline: 'mf-timeline', mf_sips: 'mf-sips' };
            navigateTo(tabMap[targetTab] || targetTab, navContext);
        }
    };

    return (
        <MfTimeline
            events={events}
            isLoading={false}
            onNavigate={handleNavigate}
            initialContext={context}
        />
    );
}
