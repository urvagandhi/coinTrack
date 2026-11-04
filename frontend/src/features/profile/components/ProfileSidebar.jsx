'use client';

import { cn } from '@/shared/lib/utils';
import { SETTINGS_TABS } from '../constants';

export function ProfileSidebar({ activeTab, onTabChange }) {
  return (
    <aside className='w-full md:w-60 lg:w-64 shrink-0 space-y-6 self-start'>
      <div>
        <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
          Settings
        </h1>
        <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1'>
          You can find all settings here.
        </p>
      </div>

      <nav className='flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none'>
        {SETTINGS_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDanger = tab.id === 'danger';
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap text-left shrink-0 md:shrink md:w-full',
                isActive
                  ? isDanger
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-semibold shadow-xs'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold shadow-xs'
                  : isDanger
                    ? 'text-rose-500/80 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  isActive
                    ? isDanger
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-blue-600 dark:text-blue-400'
                    : isDanger
                      ? 'text-rose-500/70'
                      : 'text-neutral-400 dark:text-neutral-500'
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default ProfileSidebar;
