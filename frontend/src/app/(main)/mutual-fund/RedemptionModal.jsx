import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import DataAccuracyWarning from "@/components/portfolio/tabs/DataAccuracyWarning";

export default function RedemptionModal({ isOpen, onClose, onSuccess, schemes, initialData }) {
  const [formData, setFormData] = useState({
    schemeId: "",
    redemptionDate: "",
    redemptionUnit: "",
    redemptionValue: "",
    redemptionNav: "",
    amountCreditedBank: "",
    isAfterCutoff: false
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [redemptionType, setRedemptionType] = useState("amount"); // 'amount' or 'unit'
  const [entryMode, setEntryMode] = useState("automatic"); // 'automatic' or 'manual'
  const [calculatedNavData, setCalculatedNavData] = useState(null);
  const [navLoading, setNavLoading] = useState(false);
  const { toast } = useToast();

  const schemesByPlatform = useMemo(() => {
    if (!schemes) return {};
    const groups = {};
    schemes.forEach((s) => {
      const platform = s.platform || "Other";
      if (!groups[platform]) groups[platform] = [];
      groups[platform].push(s);
    });
    return groups;
  }, [schemes]);

  const isRecentDate = useMemo(() => {
    if (!formData.redemptionDate) return false;
    const selectedDate = new Date(formData.redemptionDate);
    const today = new Date();
    const diffTime = Math.abs(today - selectedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }, [formData.redemptionDate]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          schemeId: initialData.schemeId || "",
          redemptionDate: initialData.redemptionDate
            ? Array.isArray(initialData.redemptionDate)
              ? `${initialData.redemptionDate[0]}-${String(initialData.redemptionDate[1]).padStart(2, '0')}-${String(initialData.redemptionDate[2]).padStart(2, '0')}`
              : initialData.redemptionDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
          redemptionUnit: initialData.redemptionUnit || "",
          redemptionValue: initialData.redemptionValue || "",
          redemptionNav: initialData.redemptionNav || "",
          amountCreditedBank: initialData.amountCreditedBank || "",
          isAfterCutoff: initialData.isAfterCutoff || false
        });
        setRedemptionType(initialData.redemptionUnit && !initialData.redemptionValue ? "unit" : "amount");
        setEntryMode(initialData.redemptionNav ? "manual" : "automatic");
      } else {
        setFormData({
          schemeId: "",
          redemptionDate: new Date().toISOString().split('T')[0],
          redemptionUnit: "",
          redemptionValue: "",
          amountCreditedBank: "",
          isAfterCutoff: false
        });
        setRedemptionType("amount");
        setEntryMode("automatic");
      }
      setLoading(false);
      setDeleteLoading(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    let active = true;
    if (isOpen && entryMode === "automatic" && formData.schemeId && formData.redemptionDate) {
      setNavLoading(true);
      mutualFundAPI.getSchemeNavForDate(formData.schemeId, formData.redemptionDate, formData.isAfterCutoff)
        .then((res) => {
          if (active) {
            setCalculatedNavData(res);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch NAV", err);
          if (active) setCalculatedNavData(null);
        })
        .finally(() => {
          if (active) setNavLoading(false);
        });
    } else {
      setCalculatedNavData(null);
    }
    return () => {
      active = false;
    };
  }, [isOpen, entryMode, formData.schemeId, formData.redemptionDate, formData.isAfterCutoff]);

  const selectedScheme = useMemo(() => {
    if (!formData.schemeId || !schemes) return null;
    return schemes.find(s => (s.id || s.schemeId) === formData.schemeId);
  }, [formData.schemeId, schemes]);

  // Debounce the units for the API call
  const [debouncedUnits, setDebouncedUnits] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUnits(formData.redemptionUnit);
    }, 500);
    return () => clearTimeout(handler);
  }, [formData.redemptionUnit]);

  const calculateMissingValue = () => {
    if (entryMode === "manual" && formData.redemptionNav) {
      if (redemptionType === "amount" && formData.redemptionValue) {
        setFormData(prev => ({ ...prev, redemptionUnit: (parseFloat(prev.redemptionValue) / parseFloat(prev.redemptionNav)).toFixed(3) }));
      } else if (redemptionType === "unit" && formData.redemptionUnit) {
        setFormData(prev => ({ ...prev, redemptionValue: (parseFloat(prev.redemptionUnit) * parseFloat(prev.redemptionNav)).toFixed(2) }));
      }
    }
  };

  const { data: previewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ["previewFifo", formData.schemeId, formData.redemptionDate, debouncedUnits],
    queryFn: () => mutualFundAPI.previewFifo({ 
      schemeId: formData.schemeId, 
      date: formData.redemptionDate, 
      units: debouncedUnits 
    }),
    enabled: !!formData.schemeId && !!formData.redemptionDate && !!debouncedUnits && redemptionType === "unit",
    staleTime: 60 * 1000,
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.redemptionValue && !formData.redemptionUnit) {
      toast({ title: "Validation Error", description: "Please enter either Redemption Value or Redeemed Units.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
      const payload = {
        ...formData,
        redemptionUnit: formData.redemptionUnit ? Number(formData.redemptionUnit) : null,
        redemptionValue: formData.redemptionValue ? Number(formData.redemptionValue) : null,
        redemptionNav: entryMode === "manual" && formData.redemptionNav ? Number(formData.redemptionNav) : null,
      };
      if (initialData?.id) {
        await mutualFundAPI.updateRedemption(initialData.id, payload);
        toast({ title: "Success", description: "Redemption updated successfully." });
      } else {
        await mutualFundAPI.createRedemption(payload);
        toast({ title: "Success", description: "Redemption recorded successfully." });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save redemption", error);
      toast({ title: "Error", description: "Failed to save redemption.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    toast({
      title: "Delete Redemption Entry?",
      description: "Are you sure you want to delete this redemption entry? This action cannot be undone.",
      variant: "warning",
      action: (
        <button
          onClick={async () => {
            setDeleteLoading(true);
            try {
              await mutualFundAPI.deleteRedemption(initialData.id);
              toast({ title: "Success", description: "Redemption entry deleted successfully." });
              onSuccess();
              onClose();
            } catch (error) {
              toast({ title: "Error", description: error.response?.data?.message || "Failed to delete redemption entry.", variant: "destructive" });
            } finally {
              setDeleteLoading(false);
            }
          }}
          className="text-[11px] font-medium text-[hsl(var(--loss))] hover:underline"
        >
          Confirm
        </button>
      ),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="ed-card w-full max-w-xl relative flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-200">
        <span className="corner-mark corner-tl" />
        <span className="corner-mark corner-tr" />
        <span className="corner-mark corner-bl" />
        <span className="corner-mark corner-br" />

        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-serif text-[24px] text-foreground leading-none mb-1">
              {initialData ? "Edit Redemption Entry" : "Record Redemption"}
            </h2>
            <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
              Mutual Fund Withdrawal
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
             <DataAccuracyWarning className="mb-4" />
          </div>
          <form id="redemption-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                01. Scheme Selection
              </h3>
              <div className="space-y-1.5">
                <label className="eyebrow">Select Scheme *</label>
                <select
                  required
                  name="schemeId"
                  value={formData.schemeId}
                  onChange={handleChange}
                  className="ed-input w-full font-mono"
                >
                  <option value="">-- Choose a Scheme --</option>
                  {Object.entries(schemesByPlatform).map(([platform, items]) => (
                    <optgroup key={platform} label={`📍 ${platform.toUpperCase()} (${items.length} Schemes)`}>
                      {items.map(s => {
                        const id = s.id || s.schemeId;
                        return (
                          <option key={id} value={id}>
                            {s.schemeName} — {s.holderName} (Folio: {s.folioNo || 'N/A'})
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                02. Redemption Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="eyebrow">Date of Redemption *</label>
                  <input
                    required
                    type="date"
                    name="redemptionDate"
                    value={formData.redemptionDate}
                    onChange={handleChange}
                    className="ed-input w-full font-mono"
                  />
                  <p className="text-xs text-ed-muted-text mt-1">
                    For historical entries, enter the actual NAV processing date, not the submission date.
                  </p>
                  {isRecentDate && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="isAfterCutoff"
                        name="isAfterCutoff"
                        checked={formData.isAfterCutoff}
                        onChange={handleChange}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <label htmlFor="isAfterCutoff" className="text-[12px] text-muted-foreground cursor-pointer">
                        Placed after 3:00 PM (Cut-off)
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4 mb-2">
                 <button
                    type="button"
                    onClick={() => setRedemptionType("amount")}
                    className={`px-3 py-1 text-[11px] font-mono uppercase tracking-[0.05em] rounded-full transition-colors ${
                       redemptionType === "amount" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                 >
                    Redeem by Amount
                 </button>
                 <button
                    type="button"
                    onClick={() => setRedemptionType("unit")}
                    className={`px-3 py-1 text-[11px] font-mono uppercase tracking-[0.05em] rounded-full transition-colors ${
                       redemptionType === "unit" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                 >
                    Redeem by Units
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start animate-in slide-in-from-top-1 fade-in duration-200">
                  <div className="space-y-1.5 flex-1">
                    <label className="eyebrow">Redemption Value (₹) {redemptionType === "amount" && "*"}</label>
                    <input
                      type="number"
                      step="0.01"
                      required={redemptionType === "amount"}
                      disabled={redemptionType !== "amount"}
                      name="redemptionValue"
                      value={formData.redemptionValue}
                      onChange={handleChange}
                      onBlur={calculateMissingValue}
                      className="ed-input w-full font-mono max-w-[50%]"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="eyebrow">Redeemed Units {redemptionType === "unit" && "*"}</label>
                      {redemptionType === "amount" && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm flex items-center gap-1 border border-border">
                          <Info className="h-3 w-3" /> Auto
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      required={redemptionType === "unit"}
                      disabled={redemptionType !== "unit" && entryMode !== "manual"}
                      name="redemptionUnit"
                      value={formData.redemptionUnit}
                      onChange={handleChange}
                      onBlur={calculateMissingValue}
                      className="ed-input w-full font-mono max-w-[50%]"
                      placeholder="e.g. 50.000"
                    />
                    {selectedScheme && formData.redemptionUnit && selectedScheme.totalUnit != null && (
                      <div className="mt-3 p-3 rounded-md bg-muted/40 border border-border/50 w-full md:max-w-[80%]">
                        <p className="text-[11px] font-mono text-muted-foreground mb-1">
                          Redeeming <strong className="text-foreground">{formData.redemptionUnit}</strong> out of <strong className="text-foreground">{selectedScheme.totalUnit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</strong> total units
                        </p>
                        <p className="text-[11px] font-mono font-medium text-accent">
                          Remaining Units: {(selectedScheme.totalUnit - parseFloat(formData.redemptionUnit || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                        </p>
                        
                        {isPreviewLoading ? (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse mt-3 pt-3 border-t border-border/50">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Calculating FIFO gains...</span>
                          </div>
                        ) : previewData ? (
                          <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">STCG Units (&lt;1 year):</span>
                              <span className="font-mono font-medium text-foreground">{previewData.stcgUnits?.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">LTCG Units (&gt;1 year):</span>
                              <span className="font-mono font-medium text-foreground">{previewData.ltcgUnits?.toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 bg-accent/20 px-2 py-1 rounded w-max">
                              <Info className="h-3 w-3 text-accent-foreground" />
                              <span className="text-[9px] uppercase tracking-widest font-mono text-accent-foreground font-semibold">
                                {previewData.stcgUnits > 0 && previewData.ltcgUnits > 0 ? "STCG + LTCG Mix" : previewData.stcgUnits > 0 ? "Short Term (STCG)" : previewData.ltcgUnits > 0 ? "Long Term (LTCG)" : "No Gains Calculated"}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-4 mb-2">
                 <button
                    type="button"
                    onClick={() => setEntryMode("automatic")}
                    className={`px-3 py-1 text-[11px] font-mono uppercase tracking-[0.05em] rounded-full transition-colors ${
                       entryMode === "automatic" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                 >
                    Automatic Mode
                 </button>
                 <button
                    type="button"
                    onClick={() => setEntryMode("manual")}
                    className={`px-3 py-1 text-[11px] font-mono uppercase tracking-[0.05em] rounded-full transition-colors ${
                       entryMode === "manual" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                 >
                    Manual Mode
                 </button>
              </div>

              {entryMode === "manual" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-1 fade-in duration-200 mt-4">
                  <div className="space-y-1.5">
                    <label className="eyebrow">NAV Price</label>
                    <input
                      type="number"
                      step="0.0001"
                      name="redemptionNav"
                      value={formData.redemptionNav}
                      onChange={handleChange}
                      onBlur={calculateMissingValue}
                      className="ed-input w-full font-mono"
                    />
                  </div>
                </div>
              )}

              {entryMode === "automatic" && (
                <div className="bg-muted/30 p-3 rounded-md border border-border mt-3 space-y-1">
                <p className="text-[11px] text-muted-foreground leading-tight">
                  NAV Price and the missing value will be auto-calculated by the system based on the NAV of the applicable settlement date.
                </p>
                {navLoading ? (
                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <Loader2 className="w-3 h-3 animate-spin mr-2" /> Fetching applicable NAV...
                  </div>
                ) : calculatedNavData?.nav ? (
                  <div className="flex flex-col text-xs mt-2 text-foreground/80 font-mono space-y-1">
                    <span className="flex justify-between"><span>Applicable Date:</span> <span className="text-foreground">{calculatedNavData.applicableDate}</span></span>
                    <span className="flex justify-between"><span>Applicable NAV:</span> <span className="text-foreground">₹{calculatedNavData.nav}</span></span>
                    {redemptionType === "amount" && formData.redemptionValue && !isNaN(parseFloat(formData.redemptionValue)) && (
                      <span className="flex justify-between font-medium text-accent"><span>Est. Redeemed Units:</span> <span>{(parseFloat(formData.redemptionValue) / calculatedNavData.nav).toFixed(3)}</span></span>
                    )}
                    {redemptionType === "unit" && formData.redemptionUnit && !isNaN(parseFloat(formData.redemptionUnit)) && (
                      <span className="flex justify-between font-medium text-accent"><span>Est. Redemption Value:</span> <span>₹{(parseFloat(formData.redemptionUnit) * calculatedNavData.nav).toFixed(2)}</span></span>
                    )}
                  </div>
                ) : calculatedNavData?.error ? (
                  <div className="text-xs text-[hsl(var(--loss))] mt-2 italic">
                    {calculatedNavData.error}
                  </div>
                ) : formData.schemeId && formData.redemptionDate ? (
                  <div className="text-xs text-ed-muted-text mt-2 italic">
                    NAV for the applicable date is currently unavailable (e.g., future date).
                  </div>
                ) : null}
              </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                03. Settlement
              </h3>
              <div className="space-y-1.5">
                <label className="eyebrow">Credited to Bank [Optional]</label>
                <input
                  type="text"
                  name="amountCreditedBank"
                  value={formData.amountCreditedBank}
                  onChange={handleChange}
                  className="ed-input w-full font-mono"
                  placeholder="e.g. HDFC Bank - 1234"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto">
          <div>
            {initialData?.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading || loading}
                className="ed-btn bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-transparent transition-colors"
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Entry"}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="ed-btn bg-card border-border hover:bg-muted text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="redemption-form"
              disabled={loading}
              className="ed-btn ed-btn-accent min-w-[120px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : initialData ? "Update Entry" : "Save Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
