'use client';

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mutualFundAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Download, Plus, AlertTriangle, Loader2 } from "lucide-react";
import NewSchemeModal from "./NewSchemeModal";
import { cn } from "@/lib/utils";

import DashboardTab from "./components/DashboardTab";
import SchemeSummaryTab from "./components/SchemeSummaryTab";
import ValuationTab from "./components/ValuationTab";
import LumpsumTab from "./components/LumpsumTab";
import RedemptionTab from "./components/RedemptionTab";
import SipTab from "./components/SipTab";

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'summary', label: 'Schemes' },
  { id: 'lumpsum', label: 'Lumpsum Investment' },
  { id: 'sip', label: 'SIP Details' },
  { id: 'redemption', label: 'Redemption Details' },
  { id: 'valuation', label: 'Investment & Valuation' },
];

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function MutualFundDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries();
  };

  const { data: summaryData, isLoading, refetch } = useQuery({
    queryKey: ["mutualFundDashboard"],
    queryFn: () => mutualFundAPI.getDashboard(),
    staleTime: 30 * 1000,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blobData = await mutualFundAPI.exportExcel();
      const url = window.URL.createObjectURL(
        new Blob([blobData], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Mutual_Funds_Ledger.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Export Successful",
        description: "Mutual Fund ledger downloaded as 5-tab Excel (.xlsx).",
      });
    } catch (error) {
      console.error("Export failed", error);
      toast({
        title: "Export Failed",
        description: "Could not export Mutual Fund ledger.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const totalInvestment = summaryData?.totalInvestment || 0;
  const currentValue = summaryData?.currentValue || 0;
  const absoluteGain = summaryData?.absoluteGain || 0;
  const isTotalProfit = absoluteGain >= 0;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="pb-6 border-b border-hairline flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="index-num">FOLIO·§09</span>
            <span className="h-px w-8 bg-hairline" />
            <span className="eyebrow">Equities & Wealth</span>
          </div>
          <h1 className="display-serif text-[40px] md:text-[56px] text-foreground leading-none">
            Mutual <span className="italic text-[hsl(var(--accent))]">Funds</span>
          </h1>

          {summaryData && (
            <div className="flex gap-8 mt-4 pt-2">
              <div>
                <p className="eyebrow text-muted-foreground mb-0.5">Total Invested</p>
                <p className="font-mono text-xl font-bold">{formatCurrency(totalInvestment)}</p>
              </div>
              <div>
                <p className="eyebrow text-muted-foreground mb-0.5">Current Value</p>
                <p className="font-mono text-xl font-bold text-foreground">
                  {formatCurrency(currentValue)}
                </p>
              </div>
              {currentValue > 0 && (
                <div>
                  <p className="eyebrow text-muted-foreground mb-0.5">Overall P&L</p>
                  <div
                    className={cn(
                      "flex items-end gap-1 font-mono text-xl font-bold",
                      isTotalProfit ? "text-[hsl(var(--gain))]" : "text-[hsl(var(--loss))]"
                    )}
                  >
                    <span>
                      {isTotalProfit ? "+" : ""}
                      {formatCurrency(absoluteGain)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            disabled={isExporting}
            onClick={handleExport}
            className="ed-btn bg-card text-foreground border-border hover:bg-muted disabled:opacity-50 flex items-center gap-2 justify-center"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Export Ledger</span>
              </>
            )}
          </button>
          <button onClick={() => { setEditingScheme(null); setIsModalOpen(true); }} className="ed-btn ed-btn-accent">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>New Scheme</span>
          </button>
        </div>
      </header>

      {/* DISCREPANCY WARNING BANNER */}
      {summaryData?.discrepancyFlag && (
        <div className="p-4 rounded-sm border border-[hsl(var(--chart-4))]/40 bg-[hsl(var(--chart-4))]/10 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--chart-4))] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-[12px]">
            <p className="font-semibold text-foreground font-serif">
              Valuation Snapshot Discrepancy Detected
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Discrepancies found between scheme transaction totals and logged valuation snapshots.
            </p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-1.5 flex-wrap pb-4 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'h-7 px-3 text-[11px] font-mono tracking-[0.05em] border transition-colors rounded-sm',
              activeTab === tab.id
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-hairline hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div>
        {activeTab === 'dashboard' && <DashboardTab summaryData={summaryData} />}
        {activeTab === 'summary' && <SchemeSummaryTab 
          onNewScheme={() => { setEditingScheme(null); setIsModalOpen(true); }} 
          onEditScheme={(scheme) => { setEditingScheme(scheme); setIsModalOpen(true); }}
        />}
        {activeTab === 'valuation' && <ValuationTab />}
        {activeTab === 'lumpsum' && <LumpsumTab />}
        {activeTab === 'redemption' && <RedemptionTab />}
        {activeTab === 'sip' && <SipTab />}
      </div>

      <NewSchemeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingScheme(null); }}
        onSuccess={handleSuccess}
        initialData={editingScheme}
      />
    </div>
  );
}
