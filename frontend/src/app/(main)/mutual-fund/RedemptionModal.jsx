import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export default function RedemptionModal({ isOpen, onClose, onSuccess, schemes, initialData }) {
  const [formData, setFormData] = useState({
    schemeId: "",
    redemptionDate: "",
    redemptionUnit: "",
    redemptionValue: "",
    redemptionNav: "",
    amountCreditedBank: ""
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
          redemptionDate: initialData.redemptionDate
            ? Array.isArray(initialData.redemptionDate)
              ? `${initialData.redemptionDate[0]}-${String(initialData.redemptionDate[1]).padStart(2, '0')}-${String(initialData.redemptionDate[2]).padStart(2, '0')}`
              : initialData.redemptionDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
          redemptionUnit: initialData.redemptionUnit || "",
          redemptionValue: initialData.redemptionValue || "",
          redemptionNav: initialData.redemptionNav || "",
          amountCreditedBank: initialData.amountCreditedBank || ""
        });
      } else {
        setFormData({
          schemeId: "",
          redemptionDate: new Date().toISOString().split('T')[0],
          redemptionUnit: "",
          redemptionValue: "",
          redemptionNav: "",
          amountCreditedBank: ""
        });
      }
      setLoading(false);
      setDeleteLoading(false);
    }
  }, [isOpen, initialData]);

  const selectedScheme = useMemo(() => {
    if (!formData.schemeId || !schemes) return null;
    return schemes.find(s => (s.id || s.schemeId) === formData.schemeId);
  }, [formData.schemeId, schemes]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateNav = () => {
    const units = parseFloat(formData.redemptionUnit);
    const value = parseFloat(formData.redemptionValue);
    if (!isNaN(units) && !isNaN(value) && units > 0 && !formData.redemptionNav) {
      setFormData({ ...formData, redemptionNav: (value / units).toFixed(4) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        redemptionUnit: formData.redemptionUnit ? Number(formData.redemptionUnit) : null,
        redemptionValue: formData.redemptionValue ? Number(formData.redemptionValue) : null,
        redemptionNav: formData.redemptionNav ? Number(formData.redemptionNav) : null,
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

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!window.confirm("Are you sure you want to delete this redemption entry?")) return;
    setDeleteLoading(true);
    try {
      await mutualFundAPI.deleteRedemption(initialData.id);
      toast({ title: "Deleted", description: "Redemption deleted successfully." });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to delete redemption", error);
      toast({ title: "Error", description: "Failed to delete redemption.", variant: "destructive" });
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
            <h2 className="font-serif text-[24px] text-foreground leading-none mb-1 text-[hsl(var(--loss))]">
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
                </div>
                <div className="space-y-1.5">
                  <label className="eyebrow">Redemption Value (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="redemptionValue"
                    value={formData.redemptionValue}
                    onChange={handleChange}
                    onBlur={calculateNav}
                    className="ed-input w-full font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="eyebrow">Redeemed Units *</label>
                    {selectedScheme && selectedScheme.totalUnit != null && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Total: <strong className="text-foreground">{selectedScheme.totalUnit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</strong>
                      </span>
                    )}
                  </div>
                  <input
                    required
                    type="number"
                    step="0.001"
                    name="redemptionUnit"
                    value={formData.redemptionUnit}
                    onChange={handleChange}
                    onBlur={calculateNav}
                    className="ed-input w-full font-mono"
                    placeholder="e.g. 50.000"
                  />
                  {selectedScheme && formData.redemptionUnit && selectedScheme.totalUnit != null && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                      Redeeming <strong className="text-[hsl(var(--loss))]">{formData.redemptionUnit}</strong> out of <strong className="text-foreground">{selectedScheme.totalUnit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</strong> total units
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="eyebrow">Redemption NAV Price</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="redemptionNav"
                    value={formData.redemptionNav}
                    onChange={handleChange}
                    className="ed-input w-full font-mono"
                  />
                </div>
              </div>
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
          {initialData?.id ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading || loading}
              className="ed-btn bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 text-xs"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Entry"}
            </button>
          ) : (
            <div />
          )}
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
              className="ed-btn ed-btn-accent min-w-[120px] bg-[hsl(var(--loss))] border-[hsl(var(--loss))] hover:bg-[hsl(var(--loss))]/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : initialData ? "Update Redemption" : "Save Redemption"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
