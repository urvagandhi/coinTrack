'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/lib/hooks';
import { SearchCombobox } from '@/components/ui/search/search-combobox';

export default function BankSearchCombobox({ value, onChange, onSelectBank }) {
  const [query, setQuery] = useState(value || '');
  const [banks, setBanks] = useState([]); // Master list
  const [results, setResults] = useState([]); // Filtered list
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 200);
  const ignoreSearchRef = useRef(false);
  const inputRef = useRef(null);

  // Fetch all banks once on mount
  useEffect(() => {
    async function fetchBanks() {
      setLoading(true);
      try {
        const cachedBanks = sessionStorage.getItem('all_banks_cache');
        if (cachedBanks) {
          setBanks(JSON.parse(cachedBanks));
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/ifsc?type=all_banks`);
        const data = await res.json();
        if (data && data.status && data.data && data.data.banks) {
          setBanks(data.data.banks);
          sessionStorage.setItem(
            'all_banks_cache',
            JSON.stringify(data.data.banks)
          );
        }
      } catch (err) {
        console.error('Failed to load banks:', err);
        setApiFailed(true);
      } finally {
        setLoading(false);
      }
    }
    fetchBanks();
  }, []);

  useEffect(() => {
    if (value !== query) {
      ignoreSearchRef.current = true;
      setQuery(value || '');
    }
  }, [value, query]);

  useEffect(() => {
    if (ignoreSearchRef.current) {
      ignoreSearchRef.current = false;
      return;
    }

    const isFocused = inputRef.current === document.activeElement;
    if (!isFocused || !debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Client-side filtering
    const lowerQuery = debouncedQuery.toLowerCase();
    const filtered = banks
      .filter(
        b =>
          b.bank_name.toLowerCase().includes(lowerQuery) ||
          b.bank_code.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20); // Show max 20 results

    setResults(filtered);
    setOpen(filtered.length > 0);
  }, [debouncedQuery, banks]);

  return (
    <SearchCombobox
      inputRef={inputRef}
      value={query}
      onChange={val => {
        setQuery(val);
        onChange(val);
      }}
      onSelect={item => {
        setQuery(item.bank_name);
        onChange(item.bank_name);
        onSelectBank?.(item);
        setOpen(false);
      }}
      results={results}
      loading={loading}
      open={open}
      onOpenChange={setOpen}
      placeholder='e.g. State Bank of India or SBIN'
      getKey={item => item.id}
      renderItem={item => (
        <>
          <div className='font-sans text-xs sm:text-sm font-medium text-foreground leading-tight'>
            {item.bank_name}
          </div>
          {item.bank_code && (
            <div className='font-mono text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider'>
              {item.bank_code}
            </div>
          )}
        </>
      )}
    />
  );
}
