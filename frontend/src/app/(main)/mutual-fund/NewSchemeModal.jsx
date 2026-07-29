"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CategoryDropdown from "@/components/ui/CategoryDropdown";
import SchemeSearchCombobox from "@/components/ui/SchemeSearchCombobox";
import BankSearchCombobox from "@/components/ui/BankSearchCombobox";

function autoExtractCategory(name) {
  if (!name) return "";
  const lower = name.toLowerCase();
  if (lower.includes('elss') || lower.includes('tax saver')) return 'ELSS';
  if (lower.includes('liquid')) return 'Liquid';
  if (lower.includes('flexi cap')) return 'Flexi Cap';
  if (lower.includes('small cap')) return 'Small Cap';
  if (lower.includes('mid cap') || lower.includes('midcap')) return 'Mid Cap';
  if (lower.includes('large cap') || lower.includes('bluechip')) return 'Large Cap';
  if (lower.includes('multi cap') || lower.includes('multicap')) return 'Multi Cap';
  if (lower.includes('index')) return 'Index Fund';
  if (lower.includes('arbitrage')) return 'Arbitrage';
  if (lower.includes('balanced') || lower.includes('advantage')) return 'Balanced Advantage';
  if (lower.includes('gilt')) return 'Gilt';
  if (lower.includes('gold')) return 'Gold ETF';
  if (lower.includes('silver')) return 'Silver ETF';
  if (lower.includes('overnight')) return 'Overnight';
  if (lower.includes('fund of fund') || lower.includes('fof')) return 'Fund of Funds';
  if (lower.includes('equity')) return 'Sectoral';
  if (lower.includes('debt') || lower.includes('bond')) return 'Corporate Bond';
  return "";
}

export default function NewSchemeModal({ isOpen, onClose, onSuccess, initialData, onDelete }) {
  const [formData, setFormData] = useState({
    holderName: "",
    schemeName: "",
    amfiCode: "",
    mfCategory: "",
    platform: "",
    folioNo: "",
    bank: ""
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          holderName: initialData.holderName || "",
          schemeName: initialData.schemeName || "",
          amfiCode: initialData.amfiCode || "",
          mfCategory: initialData.mfCategory || "",
          platform: initialData.platform || "",
          folioNo: initialData.folioNo || "",
          bank: initialData.bank || ""
        });
      } else {
        setFormData({
          holderName: user?.name || user?.username || "",
          schemeName: "",
          amfiCode: "",
          mfCategory: "",
          platform: "",
          folioNo: "",
          bank: ""
        });
      }
      setLoading(false);
      setDeleteLoading(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id || initialData?.schemeId) {
        await mutualFundAPI.updateScheme(initialData.id || initialData.schemeId, formData);
        toast({ title: "Success", description: "Scheme updated successfully." });
      } else {
        await mutualFundAPI.createScheme(formData);
        toast({ title: "Success", description: "Scheme created successfully." });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save scheme", error);
      toast({ title: "Error", description: "Failed to save scheme. Check console for details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this scheme? All associated lumpsums and SIPs will be deleted!")) return;
    setDeleteLoading(true);
    try {
      await mutualFundAPI.deleteScheme(initialData.id || initialData.schemeId);
      toast({ title: "Success", description: "Scheme deleted successfully." });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete scheme.", variant: "destructive" });
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
              New Mutual Fund Scheme
            </h2>
            <p className="text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]">
              Scheme Master Creation
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
          <form id="new-scheme-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="eyebrow">Scheme Name *</label>
              <SchemeSearchCombobox
                value={formData.schemeName}
                onChange={(val) => setFormData({ ...formData, schemeName: val })}
                onSelectScheme={(scheme) => {
                  const extractedCat = autoExtractCategory(scheme.schemeName);
                  setFormData({ 
                    ...formData, 
                    schemeName: scheme.schemeName, 
                    amfiCode: scheme.schemeCode.toString(),
                    mfCategory: extractedCat || formData.mfCategory
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-1.5">
                <label className="eyebrow">Holder Name *</label>
                <input
                  required
                  type="text"
                  name="holderName"
                  value={formData.holderName}
                  readOnly
                  disabled
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="ed-input w-full font-mono bg-muted/40 cursor-not-allowed opacity-70"
                />
              </div>

              <div className="space-y-1.5">
                <label className="eyebrow">Platform *</label>
                <input
                  required
                  type="text"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  placeholder="e.g. Coin, CAMS, Karvy"
                  className="ed-input w-full font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="eyebrow">Folio Number *</label>
                <input
                  required
                  type="text"
                  name="folioNo"
                  value={formData.folioNo}
                  onChange={handleChange}
                  placeholder="Enter Folio No."
                  className="ed-input w-full font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="eyebrow">MF Category</label>
                <CategoryDropdown
                  value={formData.mfCategory}
                  onChange={(cat) => setFormData({ ...formData, mfCategory: cat })}
                  placeholder="Select Category"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="eyebrow">Linked Bank *</label>
                <BankSearchCombobox
                  value={formData.bank}
                  onChange={(bank) => setFormData({ ...formData, bank })}
                />
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
              form="new-scheme-form"
              disabled={loading || deleteLoading}
              className="ed-btn ed-btn-accent min-w-[120px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? "Update Scheme" : "Save Scheme")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
