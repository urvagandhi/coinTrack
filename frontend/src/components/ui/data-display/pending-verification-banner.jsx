'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, Loader2, Mail, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/primitives/button';
import { AnimatedWarningIcon } from '@/components/ui/feedback/animated-icons';
import { Badge } from '@/components/ui/primitives/badge';
import { detectWebmailProvider, openWebmailProvider } from '@/lib/webmail';

export function PendingVerificationBanner({
  isVerified = false,
  onResend,
  onVerifyNow,
  userEmail = 'urva@cointrack.in',
  className,
}) {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [justSent, setJustSent] = useState(false);

  // Dynamic countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleOpenEmail = useCallback(
    e => {
      e.preventDefault();
      const provider = detectWebmailProvider(userEmail);
      if (openWebmailProvider(provider)) return;
      if (typeof window !== 'undefined') {
        window.open('https://mail.google.com', '_blank');
      }
    },
    [userEmail]
  );

  if (isVerified) return null;

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);

    if (onResend) {
      await onResend();
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsResending(false);
    setJustSent(true);
    setCooldown(30);

    setTimeout(() => {
      setJustSent(false);
    }, 2500);
  };

  return (
    <div
      role='alert'
      className={cn(
        'relative w-full border-b border-border/60 bg-muted/40 backdrop-blur-md px-4 py-2.5 sm:px-6 transition-colors',
        className
      )}
    >
      <div className='mx-auto flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl'>
        {/* Left Side: Status Icon, Badge, and Message */}
        <div className='flex flex-col sm:flex-row gap-3 sm:items-start w-full min-w-0'>
          <AnimatedWarningIcon
            loop={true}
            className='size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5'
          />

          <div className='flex items-start gap-2.5 min-w-0 text-xs sm:text-[13px]'>
            <Badge variant='warning' className='shrink-0'>
              Action Required
            </Badge>
            <div className='flex flex-col gap-1 min-w-0 mt-0.5'>
              <span className='font-display font-bold text-neutral-950 tracking-tight leading-none'>
                Confirm your email address
              </span>
              <span className='font-sans text-neutral-700/90 truncate leading-none'>
                Verification sent to{' '}
                <strong className='font-mono tabular-nums font-semibold text-neutral-900'>
                  {userEmail}
                </strong>
                .{/* Unverified accounts cannot withdraw funds. */}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Actions built from @/components/ui primitives */}
        <div className='flex items-center justify-end gap-2 w-full md:w-auto shrink-0'>
          {onVerifyNow && (
            <Button
              variant='outline'
              size='sm'
              onClick={onVerifyNow}
              className='text-xs'
            >
              <CheckCircle2 className='size-3.5 text-emerald-600 dark:text-emerald-400' />
              <span>Verify Link (Test)</span>
            </Button>
          )}

          <Button
            variant='default'
            size='sm'
            onClick={handleOpenEmail}
            className='text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
          >
            <ExternalLink className='size-3.5' />
            <span>Open Gmail</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className={cn(
              'text-xs min-w-[124px]',
              justSent &&
                'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium'
            )}
          >
            {isResending ? (
              <>
                <Loader2 className='size-3.5 animate-spin' />
                <span>Sending...</span>
              </>
            ) : justSent ? (
              <>
                <CheckCircle2 className='size-3.5 text-emerald-500' />
                <span>Email Sent</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className='size-3.5 text-muted-foreground' />
                <span>Resend in {cooldown}s</span>
              </>
            ) : (
              <>
                <Mail className='size-3.5' />
                <span>Resend Email</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
