'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function DesignLabDashboardClient() {
  const router = useRouter();

  return (
    <main className='min-h-screen w-full flex items-center justify-center bg-background px-6'>
      <div className='max-w-md w-full text-center space-y-6'>
        <div className='mx-auto size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center'>
          <ShieldCheck className='size-8 text-emerald-500' />
        </div>
        <div className='space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>
            Verified — you&apos;re in.
          </h1>
          <p className='text-sm text-muted-foreground'>
            This is a dummy post-2FA screen for the design lab. Wire the real
            dashboard here later.
          </p>
        </div>
        <div className='flex items-center justify-center gap-3'>
          <button
            type='button'
            onClick={() => router.push('/design-lab/verify-2fa')}
            className='inline-flex items-center justify-center rounded-xl border border-border/60 bg-background px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted/40'
          >
            Re-test verification
          </button>
          <button
            type='button'
            onClick={() => router.push('/design-lab/login')}
            className='inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
          >
            Back to login
          </button>
        </div>
      </div>
    </main>
  );
}
