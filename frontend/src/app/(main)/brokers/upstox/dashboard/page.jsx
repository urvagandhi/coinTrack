// src/app/(main)/brokers/upstox/dashboard/page.jsx — Redirect to portfolio
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UpstoxDashboardRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/portfolio?tab=holdings'); }, [router]);
    return null;
}
