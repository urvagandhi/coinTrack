"use client";

import React, { useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { SEBI_MF_CATEGORIES } from "@/lib/mfCategories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function CategoryDropdown({ value, onChange, placeholder = "Select Category" }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten all categories for search
  const flatCategories = React.useMemo(() => {
    return SEBI_MF_CATEGORIES.reduce((acc, group) => {
      acc.push(...group.categories);
      return acc;
    }, []);
  }, []);

  const searchResults = flatCategories.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (cat) => {
    onChange(cat);
    setOpen(false);
    setSearchQuery(""); // Reset search after select
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ed-input w-full flex items-center justify-between font-mono text-left cursor-pointer"
        >
          <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>
            {value || placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] font-mono">
        <div className="px-2 pb-2 pt-1 mt-1 border-b border-border mb-1">
          <div className="flex items-center px-2 py-1.5 border border-border rounded-md bg-muted/30">
            <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
            <input
              type="text"
              className="w-full bg-transparent text-xs outline-none font-mono text-foreground placeholder:text-muted-foreground"
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()} // Prevent Radix menu shortcuts from firing while typing
            />
          </div>
        </div>

        {searchQuery ? (
          <div className="max-h-72 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  className="cursor-pointer py-1.5 px-3"
                  onClick={() => handleSelect(cat)}
                >
                  <span className={value === cat ? "font-bold text-primary" : ""}>
                    {cat}
                  </span>
                  {value === cat && <Check className="ml-auto h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No categories found.
              </div>
            )}
          </div>
        ) : (
          SEBI_MF_CATEGORIES.map((groupObj) => (
            <DropdownMenuSub key={groupObj.group}>
              <DropdownMenuSubTrigger className="py-2 cursor-pointer">
                <span>{groupObj.group}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="font-mono max-h-72 overflow-y-auto">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {groupObj.group}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groupObj.categories.map((cat) => {
                    const isSelected = value === cat;
                    return (
                      <DropdownMenuItem
                        key={cat}
                        className="cursor-pointer py-1.5"
                        onClick={() => handleSelect(cat)}
                      >
                        <span className={isSelected ? "font-bold text-primary" : ""}>{cat}</span>
                        {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
