"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/lib/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function BankSearchCombobox({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [banks, setBanks] = useState([]); // Master list
  const [results, setResults] = useState([]); // Filtered list
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  
  const debouncedQuery = useDebounce(query, 200);
  const ignoreSearchRef = useRef(false);
  const inputRef = useRef(null);

  // Fetch all banks once on mount
  useEffect(() => {
    async function fetchBanks() {
      setLoading(true);
      try {
        const cachedBanks = sessionStorage.getItem("all_banks_cache");
        if (cachedBanks) {
           setBanks(JSON.parse(cachedBanks));
           setApiFailed(false);
           setLoading(false);
           return;
        }

        const res = await fetch(`/api/ifsc?type=all_banks`);
        const data = await res.json();
        if (data && data.status && data.data && data.data.banks) {
           setBanks(data.data.banks);
           sessionStorage.setItem("all_banks_cache", JSON.stringify(data.data.banks));
           setApiFailed(false);
        } else {
           setApiFailed(true);
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
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
      setQuery(value || "");
    }
  }, [value]);

  useEffect(() => {
    if (ignoreSearchRef.current) {
      ignoreSearchRef.current = false;
      return;
    }

    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      if (inputRef.current === document.activeElement) {
        setOpen(false);
      }
      return;
    }

    // Client-side filtering
    const lowerQuery = debouncedQuery.toLowerCase();
    const filtered = banks.filter(b => 
       b.bank_name.toLowerCase().includes(lowerQuery) || 
       b.bank_code.toLowerCase().includes(lowerQuery)
    ).slice(0, 20); // Show max 20 results

    setResults(filtered);
    
    // Only auto-open if the user is actively focused on the input
    if (inputRef.current === document.activeElement) {
      setOpen(filtered.length > 0);
    }
  }, [debouncedQuery, banks]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value); // Keep passing raw string to parent
              if (e.target.value.length >= 2) setOpen(true);
              else setOpen(false);
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                if (apiFailed) return; // Allow manual entry if API limit reached or failed
                
                if (query && banks.length > 0) {
                   const exactMatch = banks.find(b => 
                     b.bank_name.toLowerCase() === query.trim().toLowerCase() ||
                     b.bank_code.toLowerCase() === query.trim().toLowerCase()
                   );
                   if (exactMatch) {
                      setQuery(exactMatch.bank_name);
                      onChange(exactMatch.bank_name);
                   } else {
                      setQuery("");
                      onChange("");
                   }
                }
              }, 200);
            }}
            placeholder="e.g. State Bank of India or SBIN"
            className="ed-input w-full font-mono text-[14px] py-2.5 pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 shadow-xl border-border max-h-60 overflow-y-auto font-mono" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {results.map((bank) => (
          <button
            key={bank.bank_code}
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 border-b border-hairline last:border-b-0 focus:bg-muted/50 outline-none"
            onMouseDown={(e) => {
              // Prevent input from losing focus when clicking a dropdown item
              e.preventDefault();
            }}
            onClick={() => {
              ignoreSearchRef.current = true;
              setQuery(bank.bank_name);
              onChange(bank.bank_name);
              setOpen(false);
            }}
          >
            <div className="font-medium text-foreground leading-tight">
              {bank.bank_name}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
              CODE: {bank.bank_code}
            </div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
