// src/app/(main)/brokers/zerodha/dashboard/page.jsx — Redirect to portfolio
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ZerodhaDashboardRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/portfolio?tab=holdings'); }, [router]);
    return null;
}
