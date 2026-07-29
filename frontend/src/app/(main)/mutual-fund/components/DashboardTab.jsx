import React from "react";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function AllocationCard({ title, data = [] }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="ed-card p-5 relative overflow-hidden">
      <span className="corner-mark corner-tl" />
      <span className="corner-mark corner-tr" />
      <span className="corner-mark corner-bl" />
      <span className="corner-mark corner-br" />
      <h3 className="font-serif italic text-lg mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="font-medium text-foreground">{item.label}</span>
              <span className="font-mono text-muted-foreground">
                {item.percentage ? item.percentage.toFixed(1) : 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${item.percentage || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceList({ title, data = [], isWorst = false }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="ed-card p-5 relative overflow-hidden">
      <h3 className="font-serif italic text-lg mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0 last:pb-0">
            <span className="text-[13px] font-medium max-w-[200px] truncate" title={item.schemeName}>
              {item.schemeName}
            </span>
            <div className="text-right">
              <p className="font-mono text-[13px]">{formatCurrency(item.currentValue)}</p>
              <p
                className={cn(
                  "font-mono text-[11px]",
                  item.absoluteReturn >= 0 ? "text-[hsl(var(--gain))]" : "text-[hsl(var(--loss))]"
                )}
              >
                {item.absoluteReturn >= 0 ? "+" : ""}
                {item.absoluteReturn?.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardTab({ summaryData }) {
  if (!summaryData) {
    return (
      <section className="ed-card p-12 text-center max-w-md mx-auto">
        <PieChart className="h-8 w-8 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
        <p className="font-serif italic text-xl mb-1">No Dashboard Data</p>
        <p className="text-[12px] text-muted-foreground">Start by adding a mutual fund scheme.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AllocationCard title="Category Allocation" data={summaryData.categoryAllocation} />
        <AllocationCard title="Platform Allocation" data={summaryData.platformAllocation} />
        <AllocationCard title="Bank Allocation" data={summaryData.bankAllocation} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PerformanceList title="Top Performing Funds" data={summaryData.topPerformingFunds} />
        <PerformanceList title="Needs Attention" data={summaryData.worstPerformingFunds} isWorst={true} />
      </div>
    </div>
  );
}
