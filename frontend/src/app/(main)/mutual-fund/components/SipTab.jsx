import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mutualFundAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Repeat, Plus, Play, Square, Pause } from "lucide-react";
import SipContributionModal from "../SipContributionModal";
import SipMandateModal from "../SipMandateModal";
import { useToast } from "@/components/ui/use-toast";

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  if (Array.isArray(dateStr)) {
    const [y, m, d] = dateStr;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return dateStr;
}

function getDayOfMonth(dateStr) {
  if (!dateStr) return 0;
  if (Array.isArray(dateStr)) return dateStr[2] || 0;
  if (typeof dateStr === 'string') {
    const parts = dateStr.split('-');
    if (parts.length >= 3) return parseInt(parts[2], 10);
    return new Date(dateStr).getDate() || 0;
  }
  return 0;
}

function calculateDuration(start, end) {
  if (!start) return '-';
  
  const parseDate = (d) => {
    if (Array.isArray(d)) return new Date(d[0], d[1] - 1, d[2]);
    return new Date(d);
  };
  
  const startDate = parseDate(start);
  const endDate = end ? parseDate(end) : new Date();
  
  if (isNaN(startDate) || isNaN(endDate)) return '-';
  
  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  months -= startDate.getMonth();
  months += endDate.getMonth();
  
  if (endDate.getDate() < startDate.getDate()) {
    months--;
  }
  
  if (months <= 0) return '< 1 mo';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  let result = [];
  if (years > 0) result.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (remainingMonths > 0) result.push(`${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`);
  
  return result.join(', ');
}

export default function SipTab() {
  const [isContributionModalOpen, setIsContributionModalOpen] = React.useState(false);
  const [isMandateModalOpen, setIsMandateModalOpen] = React.useState(false);
  const [editingMandate, setEditingMandate] = React.useState(null);
  const [editingContribution, setEditingContribution] = React.useState(null);
  const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, type: null, mandate: null, date: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && (key.startsWith("mf") || key.startsWith("mutualFund"));
      }
    });
  };

  const { data: schemes = [], isLoading: isLoadingSchemes } = useQuery({
    queryKey: ["mfSchemeDropdown"],
    queryFn: () => mutualFundAPI.getSchemeDropdown(),
    staleTime: 30 * 1000,
  });

  const { data: sips = [], isLoading: isLoadingSips } = useQuery({
    queryKey: ["mfSips"],
    queryFn: () => mutualFundAPI.getSipContributions(),
    staleTime: 30 * 1000,
  });

  const { data: mandates = [], isLoading: isLoadingMandates } = useQuery({
    queryKey: ["mfSipMandates"],
    queryFn: () => mutualFundAPI.getSipMandates(),
    staleTime: 30 * 1000,
  });

  const stopMutation = useMutation({
    mutationFn: ({ id, date }) => mutualFundAPI.stopSipMandate({ id, date }),
    onSuccess: () => {
      toast({ title: "Success", description: "Mandate stopped successfully." });
      handleSuccess();
    },
    onError: () => toast({ title: "Error", description: "Failed to stop mandate.", variant: "destructive" }),
  });

  const restartMutation = useMutation({
    mutationFn: ({ id, date }) => mutualFundAPI.restartSipMandate({ id, date }),
    onSuccess: () => {
      toast({ title: "Success", description: "Mandate restarted successfully." });
      handleSuccess();
    },
    onError: () => toast({ title: "Error", description: "Failed to restart mandate.", variant: "destructive" }),
  });

  const isLoading = isLoadingSchemes || isLoadingSips || isLoadingMandates;

  const data = useMemo(() => {
    const schemeMap = {};
    schemes.forEach(s => { schemeMap[s.id] = s; });

    const enrichedMandates = mandates.map(m => ({
      ...m,
      schemeName: schemeMap[m.schemeId]?.schemeName || 'Unknown Scheme',
      platform: schemeMap[m.schemeId]?.platform || 'Unknown',
      bank: m.bank || schemeMap[m.schemeId]?.bank || '-',
    }));

    const activeMandates = enrichedMandates.filter(m => m.active);
    const stoppedMandates = enrichedMandates.filter(m => !m.active);

    activeMandates.sort((a, b) => {
      const platformA = (a.platform || "").toLowerCase();
      const platformB = (b.platform || "").toLowerCase();
      if (platformA !== platformB) {
        return platformA.localeCompare(platformB);
      }
      const dayA = getDayOfMonth(a.startDate);
      const dayB = getDayOfMonth(b.startDate);
      return dayA - dayB;
    });

    stoppedMandates.sort((a, b) => {
      const platformA = (a.platform || "").toLowerCase();
      const platformB = (b.platform || "").toLowerCase();
      if (platformA !== platformB) {
        return platformA.localeCompare(platformB);
      }
      const dayA = getDayOfMonth(a.startDate);
      const dayB = getDayOfMonth(b.startDate);
      return dayA - dayB;
    });

    const enrichedSips = sips.map(s => ({
      ...s,
      schemeName: schemeMap[s.schemeId]?.schemeName || 'Unknown Scheme',
      holderName: schemeMap[s.schemeId]?.holderName || 'Unknown',
      platform: schemeMap[s.schemeId]?.platform || 'Unknown',
      debitedBank: s.debitedBank || schemeMap[s.schemeId]?.bank || '-',
    }));

    return { activeMandates, stoppedMandates, enrichedSips, totalMandates: enrichedMandates.length };
  }, [schemes, sips, mandates]);

  if (isLoading) {
    return (
      <div className="ed-card p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border pb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (data.totalMandates === 0 && data.enrichedSips.length === 0) {
    return (
      <section className="ed-card relative px-8 py-16 text-center max-w-md mx-auto">
        <span className="corner-mark corner-tl" />
        <span className="corner-mark corner-tr" />
        <span className="corner-mark corner-bl" />
        <span className="corner-mark corner-br" />
        <Repeat className="h-8 w-8 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
        <p className="font-serif italic text-[24px] text-foreground mb-1">
          No SIPs found.
        </p>
        <button onClick={() => { setEditingMandate(null); setIsMandateModalOpen(true); }} className="ed-btn ed-btn-accent mt-6">
          <Plus className="h-4 w-4" /> Setup First Mandate
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* ACTIVE MANDATES SECTION */}
      <div className="ed-card relative overflow-hidden">
        <span className="corner-mark corner-tl" />
        <span className="corner-mark corner-tr" />
        <span className="corner-mark corner-bl" />
        <span className="corner-mark corner-br" />

        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
          <h3 className="font-serif italic text-lg">Active SIP Mandates</h3>
          <button onClick={() => { setEditingMandate(null); setIsMandateModalOpen(true); }} className="ed-btn ed-btn-accent h-8 text-[11px]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>New Mandate</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Holder / Platform</th>
                <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Scheme Name</th>
                <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Debited Bank</th>
                <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Start Date / Duration</th>
                <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Amount</th>
                <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-center">Status</th>
                <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (data.activeMandates.length === 0) {
                  return (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-[12px] text-muted-foreground font-mono">
                        No active mandates.
                      </td>
                    </tr>
                  );
                }
                
                let currentPlatform = null;
                const rows = [];
                
                data.activeMandates.forEach((m) => {
                  if (m.platform !== currentPlatform) {
                    rows.push(
                      <tr key={`sep-${m.platform}`} className="bg-muted/5 border-b border-border/40">
                        <td colSpan="7" className="py-1.5 px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/10">
                          {m.platform}
                        </td>
                      </tr>
                    );
                    currentPlatform = m.platform;
                  }
                  
                  rows.push(
                    <tr 
                      key={m.id} 
                      onClick={() => { setEditingMandate(m); setIsMandateModalOpen(true); }}
                      className="border-b border-hairline hover:bg-muted/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <p className="text-[13px] font-medium text-foreground">{m.holderName}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">{m.platform}</p>
                      </td>
                      <td className="py-3 px-4 font-serif text-[14px] text-foreground font-medium">
                        {m.schemeName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[12px] text-muted-foreground">
                        {m.bank}
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-foreground">
                        <div>{formatDate(m.startDate)}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">({calculateDuration(m.startDate, null)})</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[13px] font-semibold text-foreground">
                        {formatCurrency(m.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border bg-[hsl(var(--gain))]/10 text-[hsl(var(--gain))] border-[hsl(var(--gain))]/30">ACTIVE</span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'STOP', mandate: m, date: "" }); }}
                          disabled={stopMutation.isPending}
                          className="text-[10px] font-mono text-amber-500 hover:underline inline-flex items-center gap-1"
                        >
                          <Pause className="h-3 w-3" /> STOP
                        </button>
                      </td>
                    </tr>
                  );
                });
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOPPED MANDATES SECTION */}
      {data.stoppedMandates.length > 0 && (
        <div className="ed-card relative overflow-hidden">
          <span className="corner-mark corner-tl" />
          <span className="corner-mark corner-tr" />
          <span className="corner-mark corner-bl" />
          <span className="corner-mark corner-br" />

          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h3 className="font-serif italic text-lg">Stopped SIP Mandates</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Holder / Platform</th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Scheme Name</th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Debited Bank</th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Start / End Date</th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Amount</th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-center">Status</th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let currentPlatform = null;
                  const rows = [];
                  
                  data.stoppedMandates.forEach((m) => {
                    if (m.platform !== currentPlatform) {
                      rows.push(
                        <tr key={`sep-${m.platform}`} className="bg-muted/5 border-b border-border/40">
                          <td colSpan="7" className="py-1.5 px-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/10">
                            {m.platform}
                          </td>
                        </tr>
                      );
                      currentPlatform = m.platform;
                    }
                    
                    rows.push(
                      <tr 
                        key={m.id} 
                        onClick={() => { setEditingMandate(m); setIsMandateModalOpen(true); }}
                        className="border-b border-hairline hover:bg-muted/30 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <p className="text-[13px] font-medium text-foreground">{m.holderName}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{m.platform}</p>
                        </td>
                        <td className="py-3 px-4 font-serif text-[14px] text-foreground font-medium">
                          {m.schemeName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[12px] text-muted-foreground">
                          {m.bank}
                        </td>
                        <td className="py-3 px-4 font-mono text-[13px] text-foreground">
                          <div>S: {formatDate(m.startDate)}</div>
                          {m.endDate && <div className="text-[11px] text-muted-foreground mt-0.5">E: {formatDate(m.endDate)}</div>}
                          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">({calculateDuration(m.startDate, m.endDate)})</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[13px] font-semibold text-foreground">
                          {formatCurrency(m.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border bg-amber-500/10 text-amber-600 border-amber-500/30">STOPPED</span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'RESTART', mandate: m, date: "" }); }}
                            disabled={restartMutation.isPending}
                            className="text-[10px] font-mono text-[hsl(var(--gain))] hover:underline inline-flex items-center gap-1"
                          >
                            <Play className="h-3 w-3" /> RESTART
                          </button>
                        </td>
                      </tr>
                    );
                  });
                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTRIBUTIONS SECTION */}
      <div className="ed-card relative overflow-hidden">
        <span className="corner-mark corner-tl" />
        <span className="corner-mark corner-tr" />
        <span className="corner-mark corner-bl" />
        <span className="corner-mark corner-br" />

        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
          <h3 className="font-serif italic text-lg">SIP Contribution Ledger</h3>
          <button onClick={() => { setEditingContribution(null); setIsContributionModalOpen(true); }} className="ed-btn ed-btn-ghost h-8 text-[11px] border border-border">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>Log Installment</span>
          </button>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Holder / Platform</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Scheme Name</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Debited Bank</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Month</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Amount</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">NAV / Units</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.enrichedSips.map((sip) => (
              <tr 
                key={sip.id} 
                onClick={() => { setEditingContribution(sip); setIsContributionModalOpen(true); }}
                className="border-b border-hairline hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                <td className="py-3 px-4">
                  <p className="text-[13px] font-medium text-foreground">{sip.holderName}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{sip.platform}</p>
                </td>
                <td className="py-3 px-4 font-serif text-[14px] text-foreground font-medium">
                  {sip.schemeName}
                </td>
                <td className="py-3 px-4 font-mono text-[12px] text-muted-foreground">
                  {sip.debitedBank}
                </td>
                <td className="py-3 px-4 font-mono text-[13px] text-foreground">
                  {formatDate(sip.contributionDate)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[13px] font-semibold text-foreground">
                  {formatCurrency(sip.amount)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[12px] text-foreground">
                  {sip.navPrice ? `₹${sip.navPrice}` : "-"} / {sip.totalUnit != null ? sip.totalUnit.toFixed(3) : "-"}
                </td>
                <td className="py-3 px-4 text-[12px] text-muted-foreground italic">
                  {sip.remarks || '-'}
                </td>
              </tr>
            ))}
            {data.enrichedSips.length === 0 && (
              <tr>
                <td colSpan="7" className="py-6 text-center text-[12px] text-muted-foreground font-mono">
                  No contributions logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <SipMandateModal 
        isOpen={isMandateModalOpen} 
        onClose={() => { setIsMandateModalOpen(false); setEditingMandate(null); }} 
        onSuccess={handleSuccess}
        schemes={schemes}
        initialData={editingMandate}
      />
      <SipContributionModal 
        isOpen={isContributionModalOpen} 
        onClose={() => { setIsContributionModalOpen(false); setEditingContribution(null); }} 
        onSuccess={handleSuccess}
        schemes={schemes}
        initialData={editingContribution}
      />

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="ed-card w-full max-w-md p-6 space-y-6">
            <h3 className="font-serif italic text-xl">
              {confirmModal.type === 'STOP' ? 'Stop SIP Mandate' : 'Restart SIP Mandate'}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {confirmModal.type === 'STOP' ? 'Please select the date when this SIP was stopped.' : 'Please select the new start date for this SIP.'}
              <br/>
              <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                {confirmModal.type === 'STOP' 
                  ? '(The date of the final deduction from your bank account)' 
                  : '(The date of the next scheduled deduction from your bank account)'}
              </span>
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                {confirmModal.type === 'STOP' ? 'Stopped Date' : 'Start Date'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                className="ed-input w-full"
                value={confirmModal.date}
                onChange={(e) => setConfirmModal(prev => ({...prev, date: e.target.value}))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: null, mandate: null, date: "" })}
                className="ed-btn bg-muted/50 hover:bg-muted text-foreground"
              >
                Cancel
              </button>
              <button 
                disabled={!confirmModal.date || stopMutation.isPending || restartMutation.isPending}
                onClick={() => {
                  if (confirmModal.type === 'STOP') {
                    stopMutation.mutate({ id: confirmModal.mandate.id, date: confirmModal.date });
                  } else {
                    restartMutation.mutate({ id: confirmModal.mandate.id, date: confirmModal.date });
                  }
                  setConfirmModal({ isOpen: false, type: null, mandate: null, date: "" });
                }}
                className={`ed-btn ${confirmModal.type === 'STOP' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30' : 'ed-btn-accent'}`}
              >
                {confirmModal.type === 'STOP' ? 'Stop SIP' : 'Restart SIP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
