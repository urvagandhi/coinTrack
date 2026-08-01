import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function SipMandateModal({ isOpen, onClose, onSuccess, onDelete, schemes, initialData }) {
  const { user } = useAuth();
  const defaultHolder = user?.name || user?.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user?.name || "Self");

  const [formData, setFormData] = useState({
    schemeId: "",
    startDate: "",
    endDate: "",
    amount: "",
    bank: "",
    holderName: defaultHolder,
    registrationNo: "",
    active: true
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
          startDate: initialData.startDate
            ? Array.isArray(initialData.startDate)
              ? `${initialData.startDate[0]}-${String(initialData.startDate[1]).padStart(2, '0')}-${String(initialData.startDate[2]).padStart(2, '0')}`
              : initialData.startDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
          endDate: initialData.endDate
            ? Array.isArray(initialData.endDate)
              ? `${initialData.endDate[0]}-${String(initialData.endDate[1]).padStart(2, '0')}-${String(initialData.endDate[2]).padStart(2, '0')}`
              : initialData.endDate.split('T')[0]
            : "",
          amount: initialData.amount || initialData.instalmentAmount || "",
          bank: initialData.bank || "",
          holderName: initialData.holderName || defaultHolder,
          registrationNo: initialData.registrationNo || "",
          active: initialData.active ?? (initialData.status === 'ACTIVE') ?? true
        });
      } else {
        setFormData({
          schemeId: "",
          startDate: new Date().toISOString().split('T')[0],
          endDate: "",
          amount: "",
          bank: "",
          holderName: defaultHolder,
          registrationNo: "",
          active: true
        });
      }
      setLoading(false);
      setDeleteLoading(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        endDate: formData.active ? null : formData.endDate || null
      };
      
      if (initialData?.id || initialData?.sipId) {
        await mutualFundAPI.updateSipMandate(initialData.id || initialData.sipId, payload);
        toast({ title: "Success", description: "SIP Mandate updated successfully." });
      } else {
        await mutualFundAPI.createSipMandate(payload);
        toast({ title: "Success", description: "SIP Mandate created successfully." });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add sip mandate", error);
      toast({ title: "Error", description: "Failed to save mandate.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    toast({
      title: "Delete Mandate?",
      description: "Are you sure you want to delete this mandate? This action cannot be undone.",
      variant: "warning",
      action: (
        <button
          onClick={async () => {
            setDeleteLoading(true);
            try {
              await mutualFundAPI.deleteSipMandate(initialData.id || initialData.sipId);
              toast({ title: "Success", description: "Mandate deleted successfully." });
              onSuccess();
              onClose();
            } catch (error) {
              toast({ title: "Error", description: error.response?.data?.message || "Failed to delete mandate.", variant: "destructive" });
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
              {initialData ? "Edit SIP Mandate" : "New SIP Mandate"}
            </h2>
            <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
              {initialData ? "Modify Investment Setup" : "Automated Investment Setup"}
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
          <form id="mandate-form" onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => {
                    const schemeId = e.target.value;
                    const selected = schemes?.find(s => (s.id || s.schemeId) === schemeId);
                    setFormData({
                      ...formData,
                      schemeId,
                      bank: selected?.bank || formData.bank || "",
                      holderName: selected?.holderName || formData.holderName || defaultHolder
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
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                02. Mandate Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="eyebrow">Start Date *</label>
                  <input
                    required
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="ed-input w-full font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="eyebrow">Installment Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="ed-input w-full font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="eyebrow">Bank Account</label>
                  <input
                    type="text"
                    name="bank"
                    value={formData.bank || ""}
                    readOnly
                    disabled
                    placeholder={formData.bank ? "" : "Select a scheme to auto-fill bank"}
                    className="ed-input w-full font-mono bg-muted/40 opacity-90 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="eyebrow">Registration / URN No.</label>
                  <input
                    type="text"
                    name="registrationNo"
                    value={formData.registrationNo}
                    onChange={handleChange}
                    className="ed-input w-full font-mono"
                    placeholder="e.g. BSE12345"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1">
                03. Status
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="rounded-sm border-border bg-card"
                />
                <label htmlFor="active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mark as Active Mandate
                </label>
              </div>
              {!formData.active && (
                <div className="mt-4 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <label className="eyebrow">End Date *</label>
                  <input
                    required={!formData.active}
                    type="date"
                    name="endDate"
                    value={formData.endDate || ""}
                    onChange={handleChange}
                    className="ed-input w-full md:w-1/2 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    If this mandate has been stopped, enter the date of the last installment.
                  </p>
                </div>
              )}
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
              form="mandate-form"
              disabled={loading || deleteLoading}
              className="ed-btn ed-btn-accent min-w-[120px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? "Update Mandate" : "Save Mandate")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
