// src/app/(main)/brokers/zerodha/dashboard/page.jsx — Redirect to portfolio
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ZerodhaDashboardView() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/portfolio?tab=holdings');
  }, [router]);
  return null;
}

export default ZerodhaDashboardView;
