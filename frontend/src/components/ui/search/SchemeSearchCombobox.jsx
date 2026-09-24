'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/lib/hooks';
import { logger } from '@/lib/logger';
import { SearchCombobox } from '@/components/ui/search/search-combobox';

export default function SchemeSearchCombobox({
  value,
  onChange,
  onSelectScheme,
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 200);
  const ignoreSearchRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value !== query) {
      ignoreSearchRef.current = true;
      setQuery(value || '');
    }
  }, [value, query]);

  useEffect(() => {
    const abortController = new AbortController();

    async function searchSchemes() {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setResults([]);
        setLoading(false);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        let data = [];
        try {
          const res = await fetch(
            `/api/mf-search?q=${encodeURIComponent(debouncedQuery)}`,
            { signal: abortController.signal }
          );
          if (res.ok) {
            const parsed = await res.json();
            if (Array.isArray(parsed)) data = parsed;
          }
        } catch {
          // Ignore cancellation or fetch errors
        }

        setResults(data);
        if (inputRef.current === document.activeElement) {
          setOpen(true);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // Normal lifecycle — previous request cancelled by newer keystroke
        } else {
          logger.error('SchemeSearch: fetch failed', {
            query: debouncedQuery,
            error: err.message,
          });
        }
      } finally {
        // Only set loading false if this isn't an aborted request, otherwise the next request's loading state might be overwritten
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    // Only search if focused and not explicitly ignored (e.g. programmatically set or pre-filled value)
    const isFocused = inputRef.current === document.activeElement;
    if (isFocused && !ignoreSearchRef.current) {
      searchSchemes();
    } else {
      ignoreSearchRef.current = false;
      setLoading(false);
    }

    return () => {
      abortController.abort(); // Cancel pending fetch on next effect run
    };
  }, [debouncedQuery]);

  return (
    <SearchCombobox
      inputRef={inputRef}
      value={query}
      onChange={val => {
        setQuery(val);
        onChange(val);
      }}
      onSelect={item => {
        ignoreSearchRef.current = true;
        setQuery(item.schemeName);
        onChange(item.schemeName);
        onSelectScheme(item);
        setOpen(false);
      }}
      results={results}
      loading={loading}
      open={open}
      onOpenChange={setOpen}
      placeholder='e.g. Parag Parikh Flexi Cap Fund'
      getKey={item => item.schemeCode}
      inputClassName='font-sans text-xs sm:text-sm font-medium'
      renderItem={item => (
        <>
          <div className='font-sans text-xs sm:text-sm font-medium text-foreground leading-tight'>
            {item.schemeName}
          </div>
          <div className='font-mono text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider'>
            AMFI: {item.schemeCode}
          </div>
        </>
      )}
    />
  );
}
