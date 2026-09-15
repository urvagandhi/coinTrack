'use client';

import React, { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { SEBI_MF_CATEGORIES } from '@/lib/mfCategories';
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/primitives/dropdown-menu';
import { DropdownSelect } from '@/components/ui/forms/dropdown-select';

export default function CategoryDropdown({
  value,
  onChange,
  placeholder = 'Select Category',
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all categories for search
  const flatCategories = React.useMemo(() => {
    return SEBI_MF_CATEGORIES.reduce((acc, group) => {
      acc.push(...group.categories);
      return acc;
    }, []);
  }, []);

  const searchResults = flatCategories.filter(cat =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = cat => {
    onChange(cat);
    setOpen(false);
    setSearchQuery(''); // Reset search after select
  };

  return (
    <DropdownSelect
      value={value}
      placeholder={placeholder}
      open={open}
      onOpenChange={setOpen}
      menuWidth='w-[240px]'
    >
      <div className='px-1 pb-2 pt-1 mt-1 mb-1'>
        <div className='flex items-center transition-all px-2 py-2 border border-border/50 rounded-lg bg-background/50 focus-within:ring-[3px] focus-within:ring-ring/50 shadow-sm'>
          <Search className='w-4 h-4 text-muted-foreground mr-2 shrink-0' />
          <input
            type='text'
            className='w-full bg-transparent text-xs outline-none font-sans text-foreground placeholder:text-muted-foreground'
            placeholder='Search category...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.stopPropagation()} // Prevent Radix menu shortcuts from firing while typing
          />
        </div>
      </div>

      {searchQuery ? (
        <div className='max-h-72 overflow-y-auto'>
          {searchResults.length > 0 ? (
            searchResults.map(cat => (
              <DropdownMenuItem
                key={cat}
                className='cursor-pointer py-1.5 px-3'
                onClick={() => handleSelect(cat)}
              >
                <span
                  className={
                    value === cat
                      ? 'font-semibold text-blue-600 dark:text-blue-400'
                      : ''
                  }
                >
                  {cat}
                </span>
                {value === cat && (
                  <Check className='ml-auto h-4 w-4 text-blue-600 dark:text-blue-400' />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className='py-4 text-center text-xs text-muted-foreground'>
              No categories found.
            </div>
          )}
        </div>
      ) : (
        SEBI_MF_CATEGORIES.map(groupObj => (
          <DropdownMenuSub key={groupObj.group}>
            <DropdownMenuSubTrigger className='py-2 cursor-pointer'>
              <span>{groupObj.group}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className='font-mono max-h-72 overflow-y-auto'>
                <DropdownMenuLabel className='text-[10px] uppercase tracking-wider text-muted-foreground'>
                  {groupObj.group}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {groupObj.categories.map(cat => {
                  const isSelected = value === cat;
                  return (
                    <DropdownMenuItem
                      key={cat}
                      className='cursor-pointer py-1.5'
                      onClick={() => handleSelect(cat)}
                    >
                      <span
                        className={
                          isSelected
                            ? 'font-semibold text-blue-600 dark:text-blue-400'
                            : ''
                        }
                      >
                        {cat}
                      </span>
                      {isSelected && (
                        <Check className='ml-auto h-4 w-4 text-blue-600 dark:text-blue-400' />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))
      )}
    </DropdownSelect>
  );
}
