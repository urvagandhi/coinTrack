"use client";

import React, { useState } from "react";
import { X, Loader2, RefreshCw } from "lucide-react";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function OverrideUnitsModal({ isOpen, onClose, scheme, onSuccess }) {
  const [units, setUnits] = useState(scheme?.manualTotalUnits || scheme?.totalUnit || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen || !scheme) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await mutualFundAPI.updateScheme(scheme.schemeId || scheme.id, {
        ...scheme,
        manualTotalUnits: units ? parseFloat(units) : null
      });

      toast({
        title: "Units Updated",
        description: `Successfully updated manual total units for ${scheme.schemeName}.`,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || "Failed to update units.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="ed-card w-full max-w-md bg-card border border-border shadow-2xl relative">
        <span className="corner-mark corner-tl" />
        <span className="corner-mark corner-tr" />
        <span className="corner-mark corner-bl" />
        <span className="corner-mark corner-br" />

        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-accent" />
            <h2 className="font-serif italic text-lg">Sync / Override Total Units</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="font-serif text-[15px] font-medium text-foreground">
              {scheme.schemeName}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground">
              {scheme.platform} • Folio: {scheme.folioNo || "N/A"}
            </p>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="eyebrow">Manual Total Units (Option 3 Override)</label>
            <input
              type="number"
              step="any"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="e.g. 154.208"
              className="ed-input w-full font-mono text-base py-2"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              Enter your current total units directly from your broker app. This overrides calculated units for redemptions & holdings summary. Leave empty to restore auto-calculated units.
            </p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ed-btn bg-card border-border hover:bg-muted text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ed-btn ed-btn-accent min-w-[100px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Override"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
