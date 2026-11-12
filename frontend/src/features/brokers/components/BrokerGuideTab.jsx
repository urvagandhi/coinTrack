'use client';

import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function BrokerGuideTab({
  broker,
  isEmbedded = false,
  onSwitchToCredentials,
}) {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code, index) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    toast.success('Redirect URL copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={isEmbedded ? 'space-y-4' : 'space-y-6 sm:space-y-7'}>
      {/* Section Header */}
      {isEmbedded ? (
        <div className='flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]'>
          <div>
            <h3 className='text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2'>
              <BookOpen className='size-3.5 text-neutral-400' />
              <span>Setup Instructions</span>
            </h3>
            <p className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5'>
              {broker.displayName} Developer Portal
            </p>
          </div>
          <span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'>
            {broker.setupSteps.length} Steps
          </span>
        </div>
      ) : (
        <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
          <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
            Developer Portal Setup Guide
          </h2>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Step-by-step instructions to configure your {broker.displayName}{' '}
            developer app and retrieve API keys.
          </p>
        </div>
      )}

      {/* Steps List */}
      <div className={isEmbedded ? 'space-y-3' : 'space-y-6'}>
        {broker.setupSteps.map((step, idx) => (
          <div
            key={idx}
            className={
              isEmbedded
                ? 'flex gap-3 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40'
                : 'flex gap-4 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30'
            }
          >
            <div
              className={
                isEmbedded
                  ? 'size-6 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5'
                  : 'size-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'
              }
            >
              {idx + 1}
            </div>

            <div className='flex-1 space-y-2 min-w-0'>
              <div>
                <h4 className='text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100'>
                  {step.title}
                </h4>
                <p className='text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed'>
                  {step.body}
                </p>
              </div>

              {step.code && (
                <div className='flex items-center gap-2 rounded-lg bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 p-1.5 sm:p-2 text-xs'>
                  <code className='flex-1 font-mono text-[10px] sm:text-[11px] text-neutral-800 dark:text-neutral-200 break-all select-all'>
                    {step.code}
                  </code>
                  <button
                    type='button'
                    onClick={() => handleCopy(step.code, idx)}
                    className='inline-flex items-center gap-1 h-6 sm:h-7 px-2 sm:px-2.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors cursor-pointer shrink-0'
                  >
                    {copiedCode === idx ? (
                      <>
                        <Check className='size-3 text-emerald-500' />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className='size-3 text-neutral-400' />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {step.link && (
                <a
                  href={step.link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline pt-0.5'
                >
                  <span>{step.link.label}</span>
                  <ExternalLink className='size-3' />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Security Note */}
      <div className='p-3 sm:p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-start gap-2.5 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400'>
        <ShieldCheck className='size-4 text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5' />
        <p className='leading-relaxed'>
          CoinTrack accesses your account via standard REST/OAuth2 APIs using
          read-only scopes. Order placement and trade routes are strictly
          blocked.
        </p>
      </div>

      {/* Optional Next Step CTA */}
      {onSwitchToCredentials && (
        <div className='pt-2 flex justify-end'>
          <button
            type='button'
            onClick={onSwitchToCredentials}
            className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer'
          >
            <span>Proceed to Enter Keys</span>
            <ArrowRight className='size-3.5' />
          </button>
        </div>
      )}
    </div>
  );
}

export default BrokerGuideTab;
