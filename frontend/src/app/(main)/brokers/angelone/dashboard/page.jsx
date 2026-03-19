// src/app/(main)/brokers/angelone/dashboard/page.jsx — Redirect to portfolio
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AngelOneDashboardRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/portfolio?tab=holdings'); }, [router]);
    return null;
}
