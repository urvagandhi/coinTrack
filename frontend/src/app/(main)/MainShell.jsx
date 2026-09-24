'use client';

import AuthGuard from '@/shared/auth/AuthGuard';
import MainLayout from '@/widgets/app-shell/MainLayout';

export default function MainShell({ children }) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}


