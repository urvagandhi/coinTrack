// src/hooks/usePortfolioTab.js
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const VALID_TABS = [
    'holdings', 'positions', 'orders', 'trades', 'profile',
    'mf-holdings', 'mf-orders', 'mf-sips', 'mf-timeline', 'mf-instruments',
];

export function usePortfolioTab() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const raw = searchParams.get('tab');
    const activeTab = VALID_TABS.includes(raw) ? raw : 'holdings';

    const setTab = useCallback((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        // Remove navigation context params when switching tabs normally
        params.delete('sipId');
        params.delete('highlightSipId');
        params.delete('highlightOrderId');
        params.delete('tradingSymbol');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);

    const navigateTo = useCallback((tab, context = {}) => {
        const params = new URLSearchParams();
        params.set('tab', tab);
        Object.entries(context).forEach(([k, v]) => {
            if (v !== undefined && v !== null) params.set(k, String(v));
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname]);

    const getContext = useCallback(() => {
        const ctx = {};
        for (const key of ['sipId', 'highlightSipId', 'highlightOrderId', 'tradingSymbol', 'expandSipId']) {
            const val = searchParams.get(key);
            if (val) ctx[key] = val;
        }
        return ctx;
    }, [searchParams]);

    return { activeTab, setTab, navigateTo, getContext };
}
