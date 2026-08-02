import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import DataAccuracyWarning from "@/components/portfolio/tabs/DataAccuracyWarning";

export default function LumpsumTransactionModal({ isOpen, onClose, onSuccess, schemes, initialData }) {
  const [formData, setFormData] = useState({
    schemeId: "",
    debitedBank: "",
    investmentDate: "",
    lumpsumInvestment: "",
    navPrice: "",
    totalUnit: "",
    isAfterCutoff: false,
    remarks: ""
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [entryMode, setEntryMode] = useState("automatic");
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
    if (!formData.investmentDate) return false;
    const selectedDate = new Date(formData.investmentDate);
    const today = new Date();
    const diffTime = Math.abs(today - selectedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }, [formData.investmentDate]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          schemeId: initialData.schemeId || "",
          debitedBank: initialData.debitedBank || "",
          investmentDate: initialData.investmentDate
            ? Array.isArray(initialData.investmentDate)
              ? `${initialData.investmentDate[0]}-${String(initialData.investmentDate[1]).padStart(2, '0')}-${String(initialData.investmentDate[2]).padStart(2, '0')}`
              : initialData.investmentDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
          lumpsumInvestment: initialData.lumpsumInvestment || "",
          navPrice: initialData.navPrice || "",
          totalUnit: initialData.totalUnit || "",
          isAfterCutoff: initialData.isAfterCutoff || false,
          remarks: initialData.remarks || ""
        });
        setEntryMode(initialData.navPrice ? "manual" : "automatic");
      } else {
        setFormData({
          schemeId: "",
          debitedBank: "",
          investmentDate: new Date().toISOString().split('T')[0],
          lumpsumInvestment: "",
          navPrice: "",
          totalUnit: "",
          isAfterCutoff: false,
          remarks: ""
        });
        setEntryMode("automatic");
      }
      setLoading(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    let active = true;
    if (isOpen && entryMode === "automatic" && formData.schemeId && formData.investmentDate) {
      setNavLoading(true);
      mutualFundAPI.getSchemeNavForDate(formData.schemeId, formData.investmentDate, formData.isAfterCutoff)
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
  }, [isOpen, entryMode, formData.schemeId, formData.investmentDate, formData.isAfterCutoff]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const calculateUnits = () => {
    const inv = parseFloat(formData.lumpsumInvestment);
    const nav = parseFloat(formData.navPrice);
    if (!isNaN(inv) && !isNaN(nav) && nav > 0 && !formData.totalUnit) {
      setFormData({ ...formData, totalUnit: (inv / nav).toFixed(3) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        lumpsumInvestment: Number(formData.lumpsumInvestment),
        navPrice: entryMode === "manual" && formData.navPrice ? Number(formData.navPrice) : null,
        totalUnit: entryMode === "manual" && formData.totalUnit ? Number(formData.totalUnit) : null,
      };

      if (initialData?.id) {
        await mutualFundAPI.updateLumpsum(initialData.id, payload);
        toast({ title: "Success", description: "Lumpsum transaction updated successfully." });
      } else {
        await mutualFundAPI.createLumpsum(payload);
        toast({ title: "Success", description: "Lumpsum transaction added successfully." });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add lumpsum", error);
      toast({ title: "Error", description: "Failed to add transaction.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    toast({
      title: "Delete Lumpsum Entry?",
      description: "Are you sure you want to delete this lumpsum entry? This action cannot be undone.",
      variant: "warning",
      action: (
        <button
          onClick={async () => {
            setDeleteLoading(true);
            try {
              await mutualFundAPI.deleteLumpsum(initialData.id);
              toast({ title: "Success", description: "Lumpsum entry deleted successfully." });
              onSuccess();
              onClose();
            } catch (error) {
              toast({ title: "Error", description: error.response?.data?.message || "Failed to delete lumpsum entry.", variant: "destructive" });
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
      <div className="ed-card w-full max-w-4xl relative flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-200">
        <span className="corner-mark corner-tl" />
        <span className="corner-mark corner-tr" />
        <span className="corner-mark corner-bl" />
        <span className="corner-mark corner-br" />

        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-serif text-[24px] text-foreground leading-none mb-1">
              {initialData ? "Edit Lumpsum Entry" : "New Lumpsum Entry"}
            </h2>
            <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
              Mutual Fund Investment
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
          <form id="lumpsum-form" onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8">
            {/* LEFT COLUMN: Setup */}
            <div className="flex-1 space-y-6 min-w-[300px]">
              <div className="space-y-4">
                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                  01. Configuration
                </h3>
                <div className="space-y-1.5">
                  <label className="eyebrow">Select Scheme *</label>
                  <select
                    required
                    name="schemeId"
                    value={formData.schemeId}
                    onChange={(e) => {
                      const schemeId = e.target.value;
                      const selected = schemes?.find(s => (s.id || s.schemeId) === schemeId);
                      setFormData({
                        ...formData,
                        schemeId,
                        debitedBank: selected?.bank || formData.debitedBank || ""
                      });
                    }}
                    className="ed-input w-full font-mono bg-card"
                  >
                    <option value="" disabled>-- Choose a Scheme --</option>
                    {Object.entries(schemesByPlatform).map(([platform, items]) => (
                      <optgroup key={platform} label={`${platform.toUpperCase()} (${items.length} Schemes)`}>
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

                <div className="space-y-1.5 pt-4">
                  <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1 mb-3">
                    03. Settlement
                  </h3>
                  <label className="eyebrow">Debited Bank Account *</label>
                  <input
                    required
                    type="text"
                    name="debitedBank"
                    value={formData.debitedBank || ""}
                    readOnly
                    disabled
                    placeholder={formData.debitedBank ? "" : "Select a scheme to auto-fill bank"}
                    className="ed-input w-full font-mono bg-muted/40 opacity-90 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5 pt-4">
                  <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1 mb-3">
                    04. Remarks
                  </h3>
                  <label className="eyebrow">Remarks [Optional]</label>
                  <input
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="ed-input w-full font-mono bg-card"
                    placeholder="e.g. Bonus investment"
                  />
                </div>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="hidden md:block w-px bg-border"></div>

            {/* RIGHT COLUMN: Execution Details */}
            <div className="flex-1 space-y-6 min-w-[300px]">
              <div className="space-y-4">
                <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                  02. Execution Details
                </h3>

                <div className="bg-muted/20 border border-border rounded-md p-3 mb-4 space-y-4">
                   <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground font-mono mb-1.5 block tracking-wider">Calculation Mode</span>
                        <div className="flex bg-background rounded-full p-0.5 w-max border border-border/50">
                          <button
                             type="button"
                             onClick={() => setEntryMode("automatic")}
                             className={`px-3 py-1 text-[10px] font-mono uppercase tracking-[0.05em] rounded-full transition-all ${
                                entryMode === "automatic" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                             }`}
                          >
                             Automatic
                          </button>
                          <button
                             type="button"
                             onClick={() => setEntryMode("manual")}
                             className={`px-3 py-1 text-[10px] font-mono uppercase tracking-[0.05em] rounded-full transition-all ${
                                entryMode === "manual" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                             }`}
                          >
                             Manual
                          </button>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-start animate-in slide-in-from-top-1 fade-in duration-200">
                  <div className="space-y-1.5 flex-1">
                    <label className="eyebrow">Date of Investment *</label>
                    <input
                      required
                      type="date"
                      name="investmentDate"
                      value={formData.investmentDate}
                      onChange={handleChange}
                      className="ed-input w-full font-mono bg-card"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                      For historical entries, enter the actual NAV processing date, not the submission date.
                    </p>
                    {isRecentDate && entryMode === "automatic" && (
                      <div className="flex items-center space-x-2 mt-3 p-2 bg-muted/20 border border-border/50 rounded">
                        <input
                          type="checkbox"
                          id="isAfterCutoff"
                          name="isAfterCutoff"
                          checked={formData.isAfterCutoff}
                          onChange={handleChange}
                          className="rounded border-border text-accent focus:ring-accent"
                        />
                        <label htmlFor="isAfterCutoff" className="text-[12px] text-foreground cursor-pointer font-medium">
                          Placed after 3:00 PM (Cut-off)
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="eyebrow">Investment Amount (₹) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      name="lumpsumInvestment"
                      value={formData.lumpsumInvestment}
                      onChange={handleChange}
                      onBlur={calculateUnits}
                      className="ed-input w-full font-mono bg-card"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>

                {entryMode === "manual" && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1 fade-in duration-200 mt-4">
                    <div className="space-y-1.5">
                      <label className="eyebrow">NAV Price</label>
                      <input
                        type="number"
                        step="0.0001"
                        name="navPrice"
                        value={formData.navPrice}
                        onChange={handleChange}
                        onBlur={calculateUnits}
                        className="ed-input w-full font-mono bg-card"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="eyebrow">Allotted Units</label>
                      <input
                        type="number"
                        step="0.001"
                        name="totalUnit"
                        value={formData.totalUnit}
                        onChange={handleChange}
                        className="ed-input w-full font-mono bg-card"
                      />
                    </div>
                  </div>
                )}

                {entryMode === "automatic" && (
                  <div className="bg-muted/30 p-3 rounded-md border border-border mt-3 space-y-1 animate-in fade-in zoom-in-95">
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      NAV Price and Allotted Units will be auto-calculated by the system based on the NAV of the applicable settlement date.
                    </p>
                    {navLoading ? (
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <Loader2 className="h-3 w-3 animate-spin mr-2" /> Fetching applicable NAV...
                      </div>
                    ) : calculatedNavData?.nav ? (
                      <div className="flex flex-col text-xs mt-2 text-foreground/80 font-mono space-y-1">
                        <span className="flex justify-between"><span>Applicable Date:</span> <span className="text-foreground">{calculatedNavData.applicableDate}</span></span>
                        <span className="flex justify-between"><span>Applicable NAV:</span> <span className="text-foreground">₹{calculatedNavData.nav}</span></span>
                        {formData.lumpsumInvestment && !isNaN(parseFloat(formData.lumpsumInvestment)) && (
                          <span className="flex justify-between font-medium text-accent"><span>Est. Allotted Units:</span> <span>{(parseFloat(formData.lumpsumInvestment) / calculatedNavData.nav).toFixed(3)}</span></span>
                        )}
                      </div>
                    ) : calculatedNavData?.error ? (
                      <div className="text-xs text-[hsl(var(--loss))] mt-2 italic">
                        {calculatedNavData.error}
                      </div>
                    ) : formData.schemeId && formData.investmentDate ? (
                      <div className="text-xs text-ed-muted-text mt-2 italic">
                        NAV for the applicable date is currently unavailable (e.g., future date).
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto">
          <div>
            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading || loading}
                className="ed-btn bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-transparent transition-colors"
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || deleteLoading}
              className="ed-btn bg-card border-border hover:bg-muted text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lumpsum-form"
              disabled={loading || deleteLoading}
              className="ed-btn ed-btn-accent min-w-[120px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? "Update Entry" : "Save Entry")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
