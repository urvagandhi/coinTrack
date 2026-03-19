// src/components/portfolio/tabs/MfInstrumentsTab.jsx
'use client';

import MfInstrumentList from '@/components/portfolio/MfInstrumentList';
import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfInstrumentsTab() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'mf-instruments'],
        queryFn: portfolioAPI.getMfInstruments,
        staleTime: 60 * 60 * 1000, // 1 hour
        refetchOnWindowFocus: false,
    });

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={4} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    const instruments = Array.isArray(rawData) ? rawData : (rawData?.data || []);

    return <MfInstrumentList instruments={instruments} isLoading={false} />;
}
