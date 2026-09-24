// src/app/(main)/brokers/angelone/dashboard/page.jsx — Redirect to portfolio
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AngelOneDashboardView() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/portfolio?tab=holdings');
  }, [router]);
  return null;
}

export default AngelOneDashboardView;
