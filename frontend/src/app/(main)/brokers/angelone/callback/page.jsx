// src/app/(main)/brokers/angelone/callback/page.jsx
// Angel One uses direct auth (no OAuth redirect), so redirect to setup page
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AngelOneCallbackRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/brokers/angelone'); }, [router]);
    return null;
}
