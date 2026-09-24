'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { PendingVerificationBanner } from '@/shared/ui/data-display/pending-verification-banner';
import { Button } from '@/shared/ui/primitives/button';
import { DesignLabAuthNav } from '../components/design-lab-auth-nav';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const provider = searchParams.get('provider') || 'manual';
  const verifiedParam = searchParams.get('verified');
  const userEmail = searchParams.get('email') || 'urva@cointrack.in';

  // Google sign in emails are automatically verified; manual logins default to unverified (async verification)
  const initialVerified =
    provider === 'google' ? true : verifiedParam === 'true';

  const [isVerified, setIsVerified] = useState(initialVerified);

  useEffect(() => {
    if (verifiedParam !== null) {
      setIsVerified(verifiedParam === 'true');
    }
  }, [verifiedParam]);

  const handleVerifyNow = () => {
    router.push(
      `/design-lab/verify-email?email=${encodeURIComponent(userEmail)}&from=dashboard`
    );
  };

  return (
    <div className='min-h-screen flex flex-col bg-[#f5f8fc] relative selection:bg-emerald-500/20'>
      {/* Async Email Verification Banner: shown for unverified manual users */}
      <PendingVerificationBanner
        isVerified={isVerified}
        userEmail={userEmail}
        onVerifyNow={handleVerifyNow}
      />

      <main className='flex-1 w-full flex items-center justify-center px-6 py-12'>
        <div className='max-w-md w-full text-center space-y-6'>
          <div className='mx-auto size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner'>
            <ShieldCheck className='size-8 text-emerald-500' />
          </div>

          <div className='space-y-2'>
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-mono tracking-wider font-semibold'>
              <span>
                {provider === 'google'
                  ? 'Google Authenticated'
                  : 'Credentials Authenticated'}
              </span>
            </div>
            <h1 className='font-display text-2xl font-extrabold tracking-tight text-neutral-950'>
              Authenticated — you&apos;re in.
            </h1>
            <p className='font-sans text-sm text-neutral-700/90 leading-relaxed'>
              User session for{' '}
              <span className='font-mono tabular-nums font-semibold text-neutral-900'>
                {userEmail}
              </span>{' '}
              is active.
              {isVerified
                ? ' Your email is verified with full access.'
                : ' Email verification is pending asynchronously.'}
            </p>
          </div>

          {/* Test Flow Action Buttons */}
          <div className='flex flex-wrap items-center justify-center gap-2.5 pt-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsVerified(prev => !prev)}
              className='text-xs'
            >
              {isVerified ? (
                <span className='flex items-center gap-1.5 font-sans text-neutral-700/90'>
                  <AlertCircle className='size-3.5 text-amber-500' />
                  Toggle Unverified Banner
                </span>
              ) : (
                <span className='flex items-center gap-1.5 font-sans text-neutral-700/90'>
                  <CheckCircle2 className='size-3.5 text-emerald-500' />
                  Toggle Verified
                </span>
              )}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                router.push(
                  `/design-lab/verify-2fa?email=${encodeURIComponent(userEmail)}`
                )
              }
              className='text-xs'
            >
              Re-test 2FA
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                router.push(
                  `/design-lab/setup-2fa?email=${encodeURIComponent(userEmail)}`
                )
              }
              className='text-xs'
            >
              Test 2FA Setup
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push('/design-lab/register')}
              className='text-xs'
            >
              Test Register
            </Button>
            <Button
              variant='default'
              size='sm'
              onClick={() => router.push('/design-lab/login')}
              className='text-xs'
            >
              <LogOut className='size-3.5 mr-1.5' />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </main>

      <DesignLabAuthNav />
    </div>
  );
}

export default function DesignLabDashboardClient() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-[#f5f8fc]' />}>
      <DashboardContent />
    </Suspense>
  );
}

