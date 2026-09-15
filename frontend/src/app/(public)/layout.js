'use client';

import MainLayout from '@/components/layout/MainLayout';
import { usePathname } from 'next/navigation';

export default function Layout({ children }) {
  const pathname = usePathname();

  // For testing /design-lab routes in clean isolation without sidebar or header
  if (pathname?.startsWith('/design-lab')) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
