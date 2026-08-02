import React, { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mutualFundAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowDownLeft, Plus } from "lucide-react";
import RedemptionModal from "../RedemptionModal";

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

const getStatusBadge = (status) => {
  if (status === 'COMPLETED') return <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded">Completed</span>;
  if (status === 'PENDING_NAV') return <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded">Pending NAV</span>;
  if (status === 'FAILED') return <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded flex items-center gap-1 w-max">Failed <span title="Needs manual intervention" className="cursor-help">⚠️</span></span>;
  return <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded">{status || 'Unknown'}</span>;
};

export default function RedemptionTab() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTxn, setEditingTxn] = React.useState(null);
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
    queryKey: ["mfSchemeSummaries"],
    queryFn: () => mutualFundAPI.getSchemeSummaries(),
    staleTime: 30 * 1000,
  });

  const { data: redemptions = [], isLoading: isLoadingRedemptions } = useQuery({
    queryKey: ["mfRedemptions"],
    queryFn: () => mutualFundAPI.getRedemptions(),
    staleTime: 30 * 1000,
  });

  const isLoading = isLoadingSchemes || isLoadingRedemptions;

  const data = useMemo(() => {
    const schemeMap = {};
    schemes.forEach(s => {
      const id = s.id || s.schemeId;
      schemeMap[id] = s;
    });
    return redemptions.map(r => {
      const scheme = schemeMap[r.schemeId];
      return {
        ...r,
        schemeName: scheme?.schemeName || 'Unknown Scheme',
        holderName: scheme?.holderName || 'Unknown',
        platform: scheme?.platform || 'Unknown',
      };
    }).sort((a, b) => new Date(a.redemptionDate) - new Date(b.redemptionDate));
  }, [schemes, redemptions]);

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

  if (data.length === 0) {
    return (
      <>
        <section className="ed-card relative px-8 py-16 text-center max-w-md mx-auto">
          <span className="corner-mark corner-tl" />
          <span className="corner-mark corner-tr" />
          <span className="corner-mark corner-bl" />
          <span className="corner-mark corner-br" />
          <ArrowDownLeft className="h-8 w-8 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <p className="font-serif italic text-[24px] text-foreground mb-1">
            No redemptions found.
          </p>
          <p className="text-[12px] font-mono text-muted-foreground mb-6">
            Record a partial or full redemption for your schemes.
          </p>
          <button
            onClick={() => { setEditingTxn(null); setIsModalOpen(true); }}
            className="ed-btn ed-btn-accent inline-flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>Record Redemption</span>
          </button>
        </section>
        <RedemptionModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingTxn(null); }} 
          onSuccess={handleSuccess}
          schemes={schemes}
          initialData={editingTxn}
        />
      </>
    );
  }

  return (
    <div className="ed-card relative overflow-hidden">
      <span className="corner-mark corner-tl" />
      <span className="corner-mark corner-tr" />
      <span className="corner-mark corner-bl" />
      <span className="corner-mark corner-br" />

      <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
        <h3 className="font-serif italic text-lg">Redemption Ledger</h3>
        <button
          onClick={() => { setEditingTxn(null); setIsModalOpen(true); }}
          className="ed-btn ed-btn-accent h-8 text-[11px] bg-[hsl(var(--loss))] border-[hsl(var(--loss))] hover:bg-[hsl(var(--loss))]/90"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>Record Redemption</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Txn No</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Holder / Platform</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Scheme Name</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Date</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Status</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Units Sold</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">NAV</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Invested Value</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Redemption Value</th>
              <th className="py-3 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right">Capital Gain</th>
            </tr>
          </thead>
          <tbody>
            {data.map((txn) => (
              <tr
                key={txn.id}
                onClick={() => { setEditingTxn(txn); setIsModalOpen(true); }}
                className="border-b border-hairline hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                  {txn.transactionNo}
                </td>
                <td className="py-3 px-4">
                  <p className="text-[13px] font-medium text-foreground">{txn.holderName}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{txn.platform}</p>
                </td>
                <td className="py-3 px-4 font-serif text-[14px] text-foreground font-medium">
                  {txn.schemeName}
                </td>
                <td className="py-3 px-4 font-mono text-[13px] text-foreground">
                  {txn.redemptionDate}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(txn.status)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[13px] text-foreground">
                  <p className="font-semibold text-[hsl(var(--loss))]">
                    {txn.redemptionUnit != null
                      ? txn.redemptionUnit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                      : "0.000"}
                  </p>
                  {txn.totalUnit != null && (
                    <p className="text-[10px] text-muted-foreground">
                      (of {txn.totalUnit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} total)
                    </p>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[13px] text-muted-foreground">
                  {txn.redemptionNav ? formatCurrency(txn.redemptionNav) : '-'}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[13px] text-muted-foreground">
                  {formatCurrency(txn.tradeInvestmentValue)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[13px] text-foreground">
                  <div>{formatCurrency(txn.redemptionValue)}</div>
                  {(txn.sttAmount > 0 || txn.exitLoadDeducted > 0) && (
                    <div className="mt-1 flex flex-col items-end">
                      {txn.exitLoadDeducted > 0 && (
                        <span className="text-[10px] text-[hsl(var(--loss))]" title="Exit Load Deducted">
                          - {formatCurrency(txn.exitLoadDeducted)} Exit Load
                        </span>
                      )}
                      {txn.sttAmount > 0 && (
                        <span className="text-[10px] text-[hsl(var(--loss))]" title="Securities Transaction Tax (0.001%)">
                          - {formatCurrency(txn.sttAmount)} STT
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground border-t border-border mt-0.5 pt-0.5 w-max">
                        Net: {formatCurrency(txn.netRedemptionValue)}
                      </span>
                    </div>
                  )}
                </td>
                <td className={`py-3 px-4 text-right font-mono text-[13px] font-semibold ${txn.capitalGain >= 0 ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'}`}>
                  {txn.capitalGain >= 0 ? '+' : ''}{formatCurrency(txn.capitalGain)}
                  {txn.gainType && (
                    <span className="block text-[9px] text-muted-foreground font-normal tracking-widest mt-0.5">{txn.gainType}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RedemptionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTxn(null); }} 
        onSuccess={handleSuccess}
        schemes={schemes}
        initialData={editingTxn}
      />
    </div>
  );
}
