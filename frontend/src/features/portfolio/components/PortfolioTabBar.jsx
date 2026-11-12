'use client';

import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';
import { getBrokerTabGroups, normalizeBrokerKey } from '../constants';

export function PortfolioTabBar({
  selectedBroker = 'ALL',
  activeTab = 'holdings',
  onTabChange,
  counts = {},
}) {
  const normKey = normalizeBrokerKey(selectedBroker);

  // CRITICAL USER DIRECTIVE:
  // In "All demats", this secondary categorized tab bar is completely hidden!
  if (normKey === 'ALL') {
    return null;
  }

  const tabGroups = getBrokerTabGroups(normKey, counts);

  if (!tabGroups || tabGroups.length === 0) {
    return null;
  }

  return (
    <nav className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      <div className='flex gap-0 min-w-max divide-x divide-neutral-200/80 dark:divide-neutral-800'>
        {tabGroups.map(group => (
          <div
            key={group.groupLabel}
            className='px-4 py-3 first:pl-5 last:pr-5'
          >
            {/* Eyebrow Group Header */}
            <p className='text-[10px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase mb-2 flex items-center'>
              <span className='font-mono mr-1.5 text-neutral-300 dark:text-neutral-600'>
                ·
              </span>
              <span>{group.groupLabel}</span>
            </p>

            {/* Sub-Tabs */}
            <div className='flex gap-1'>
              {group.tabs.map(tab => {
                const isActive =
                  activeTab === tab.id ||
                  (tab.id === 'brokers' && activeTab === 'profile');

                return (
                  <button
                    key={tab.id}
                    type='button'
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      'relative h-8 px-3 text-[12px] font-medium tracking-tight whitespace-nowrap transition-colors rounded-sm cursor-pointer',
                      isActive
                        ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    )}
                  >
                    {/* Active Tab Underline */}
                    {isActive && (
                      <motion.span
                        layoutId='portfolio-tab-underline'
                        className='absolute -bottom-px left-0 right-0 h-[2px] bg-orange-500'
                        transition={{
                          duration: 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    )}

                    <span className='relative z-10 inline-flex items-center'>
                      {tab.label}
                      {tab.count != null && tab.count > 0 && (
                        <span
                          className={cn(
                            'ml-1.5 px-1 font-mono tnum text-[10px] rounded-sm',
                            isActive
                              ? 'text-orange-500 font-semibold'
                              : 'text-neutral-400 dark:text-neutral-500'
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

export default PortfolioTabBar;
