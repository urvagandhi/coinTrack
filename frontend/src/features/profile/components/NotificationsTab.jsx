'use client';

import { useState } from 'react';
import { useToast } from '@/shared/ui/feedback/use-toast';
import { cn } from '@/shared/lib/utils';
import { NOTIF_LABELS } from '../constants';

export function NotificationsTab() {
  const { toast } = useToast();

  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    portfolioUpdates: true,
    marketNews: false,
    weeklyReports: true,
  });

  const handleNotif = (f, v) => {
    setNotifications(p => ({
      ...p,
      [f]: v,
    }));
    toast({
      variant: v ? 'success' : 'info',
      title: v ? 'Notification Enabled' : 'Notification Paused',
      description: `${NOTIF_LABELS[f]?.title || 'Channel'} has been ${v ? 'activated' : 'paused'}.`,
    });
  };

  return (
    <div className='space-y-2 pb-4'>
      <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
        <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
          Notifications
        </h2>
        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
          Choose which financial alerts and portfolio reports you wish to
          receive.
        </p>
      </div>

      <div className='divide-y divide-black/[0.06] dark:divide-white/[0.06]'>
        {Object.entries(notifications).map(([key, value]) => {
          const meta = NOTIF_LABELS[key] || { title: key, body: '' };
          return (
            <div
              key={key}
              className='py-4 sm:py-5 flex items-center justify-between gap-6'
            >
              <div className='space-y-1 max-w-xl'>
                <h4 className='text-xs sm:text-sm font-semibold text-foreground tracking-tight'>
                  {meta.title}
                </h4>
                <p className='text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed'>
                  {meta.body}
                </p>
              </div>

              <button
                type='button'
                role='switch'
                aria-checked={value}
                onClick={() => handleNotif(key, !value)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                  value ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-neutral-800'
                )}
              >
                <span
                  className={cn(
                    'inline-block size-3.5 rounded-full bg-white transition-transform shadow-xs',
                    value ? 'translate-x-[18px]' : 'translate-x-[2px]'
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationsTab;
