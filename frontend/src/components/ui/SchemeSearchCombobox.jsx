"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/lib/hooks";

export default function SchemeSearchCombobox({ value, onChange, onSelectScheme }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  const debouncedQuery = useDebounce(query, 200);
  const containerRef = useRef(null);
  const ignoreSearchRef = useRef(false);

  useEffect(() => {
    if (value !== query) {
      ignoreSearchRef.current = true;
      setQuery(value || "");
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    async function searchSchemes() {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: abortController.signal
        });
        const data = await res.json();
        setResults(data || []);
        setOpen(true);
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log("Fetch aborted for:", debouncedQuery);
        } else {
          console.error("Failed to search schemes:", err);
        }
      } finally {
        // Only set loading false if this isn't an aborted request, otherwise the next request's loading state might be overwritten
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    // Only search if not explicitly ignored (like on selection)
    if (!ignoreSearchRef.current) {
      searchSchemes();
    } else {
      ignoreSearchRef.current = false;
    }

    return () => {
      abortController.abort(); // Cancel pending fetch on next effect run
    };
  }, [debouncedQuery]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value); // Keep passing raw string to parent
            if (e.target.value.length >= 3) setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="e.g. Parag Parikh Flexi Cap Fund"
          className="ed-input w-full font-serif text-[16px] py-2.5 pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-xl rounded-md max-h-60 overflow-y-auto">
          {results.map((scheme) => (
            <button
              key={scheme.schemeCode}
              type="button"
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 border-b border-hairline last:border-b-0 focus:bg-muted/50 outline-none"
              onClick={() => {
                ignoreSearchRef.current = true;
                setQuery(scheme.schemeName);
                onChange(scheme.schemeName);
                onSelectScheme(scheme);
                setOpen(false);
              }}
            >
              <div className="font-serif text-[14px] text-foreground leading-tight">
                {scheme.schemeName}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                AMFI: {scheme.schemeCode}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
