import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function LumpsumTransactionModal({ isOpen, onClose, onSuccess, schemes, initialData }) {
  const [formData, setFormData] = useState({
    schemeId: "",
    debitedBank: "",
    investmentDate: "",
    lumpsumInvestment: "",
    navPrice: "",
    totalUnit: ""
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
          totalUnit: initialData.totalUnit || ""
        });
      } else {
        setFormData({
          schemeId: "",
          debitedBank: "",
          investmentDate: new Date().toISOString().split('T')[0],
          lumpsumInvestment: "",
          navPrice: "",
          totalUnit: ""
        });
      }
      setLoading(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateUnits = () => {
    const inv = parseFloat(formData.lumpsumInvestment);
    const nav = parseFloat(formData.navPrice);
    if (!isNaN(inv) && !isNaN(nav) && nav > 0) {
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
        navPrice: formData.navPrice ? Number(formData.navPrice) : null,
        totalUnit: formData.totalUnit ? Number(formData.totalUnit) : null,
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this lumpsum entry?")) return;
    setDeleteLoading(true);
    try {
      await mutualFundAPI.deleteLumpsum(initialData.id);
      toast({ title: "Success", description: "Lumpsum entry deleted successfully." });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
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
          <form id="lumpsum-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                01. Scheme Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-1.5">
                  <label className="eyebrow">Debited Bank Account *</label>
                  <input
                    required
                    type="text"
                    name="debitedBank"
                    value={formData.debitedBank || ""}
                    readOnly
                    disabled
                    placeholder={formData.debitedBank ? "" : "Select a scheme to auto-fill bank"}
                    className="ed-input w-full font-mono bg-muted/40 opacity-90"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                02. Transaction Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="eyebrow">Date of Investment *</label>
                  <input
                    required
                    type="date"
                    name="investmentDate"
                    value={formData.investmentDate}
                    onChange={handleChange}
                    className="ed-input w-full font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="eyebrow">Investment Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="lumpsumInvestment"
                    value={formData.lumpsumInvestment}
                    onChange={handleChange}
                    onBlur={calculateUnits}
                    className="ed-input w-full font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="eyebrow">NAV Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="navPrice"
                    value={formData.navPrice}
                    onChange={handleChange}
                    onBlur={calculateUnits}
                    className="ed-input w-full font-mono"
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
                    className="ed-input w-full font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Leave blank to auto-calculate based on NAV date.
                  </p>
                </div>
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
