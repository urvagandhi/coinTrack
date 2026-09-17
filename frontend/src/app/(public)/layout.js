'use client';

import MainLayout from '@/components/layout/MainLayout';
import { usePathname } from 'next/navigation';

export default function Layout({ children }) {
  const pathname = usePathname();

  // For testing /design-lab, /landing, or public isolated marketing pages without sidebar or header
  if (
    pathname?.startsWith('/design-lab') ||
    pathname?.startsWith('/landing') ||
    pathname?.startsWith('/cirrus')
  ) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
