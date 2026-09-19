'use client';

import AuthGuard from '@/components/auth-guards/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';

export default function Layout({ children }) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
