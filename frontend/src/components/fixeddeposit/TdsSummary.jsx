'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Receipt, ShieldCheck } from 'lucide-react';
import { fdAPI } from '@/lib/api';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount)))
    return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function PeriodBadge({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-3 text-[11px] font-mono tracking-[0.05em] border rounded-sm transition-colors ${
        active
          ? 'bg-foreground text-background border-foreground'
          : 'border-border text-muted-foreground hover:border-hairline hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function TdsRow({ item }) {
  const rate =
    item.tdsRate !== null && item.tdsRate !== undefined
      ? `${Number(item.tdsRate) * 100}%`
      : '—';
  const exempt = item.form15g15hSubmitted === true;
  return (
    <tr className='border-b border-hairline align-top'>
      <td className='py-3 px-4'>
        <p className='text-[13px] font-medium text-foreground'>
          {item.bankName || '—'}
        </p>
        <p className='text-[11px] font-mono text-muted-foreground'>
          FD #{item.fdNo}
        </p>
      </td>
      <td className='py-3 px-4 text-right font-mono text-[13px] text-foreground'>
        {formatCurrency(item.grossInterest)}
      </td>
      <td className='py-3 px-4 text-right font-mono text-[13px] text-muted-foreground'>
        {formatCurrency(item.tdsThreshold)}
      </td>
      <td className='py-3 px-4 text-right font-mono text-[13px] text-muted-foreground'>
        {formatCurrency(item.taxableInterest)}
      </td>
      <td className='py-3 px-4 text-center font-mono text-[13px] text-muted-foreground'>
        {rate}
      </td>
      <td className='py-3 px-4 text-right font-mono text-[13px] font-semibold text-[hsl(var(--loss))]'>
        {formatCurrency(item.tdsDeducted)}
      </td>
      <td className='py-3 px-4 text-right font-mono text-[13px] font-medium text-[hsl(var(--gain))]'>
        {formatCurrency(item.netInterest)}
      </td>
      <td className='py-3 px-4 text-center'>
        {exempt ? (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/10 text-[hsl(var(--gain))]'>
            <ShieldCheck className='h-2.5 w-2.5' /> 15G/H
          </span>
        ) : (
          <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border border-border text-muted-foreground'>
            {item.hasPan ? 'PAN' : 'No PAN'}
          </span>
        )}
      </td>
    </tr>
  );
}

function TdsSummarySection({ financialYear, onYearChange }) {
  const { data, isLoading } = useQuery({
    queryKey: ['fdTdsSummary', financialYear],
    queryFn: () => fdAPI.getTdsSummary(financialYear || undefined),
    staleTime: 30 * 1000,
  });

  const items = Array.isArray(data) ? data : [];

  const years = useQuery({
    queryKey: ['fdTdsYears'],
    queryFn: async () => {
      const all = await fdAPI.getTdsSummary();
      const list = Array.isArray(all) ? all : [];
      const distinct = [
        ...new Set(list.map(x => x.financialYear).filter(Boolean)),
      ].sort((a, b) => b - a);
      return distinct;
    },
    staleTime: 30 * 1000,
  });
  const availableYears = Array.isArray(years.data) ? years.data : [];

  const totalGross = items.reduce(
    (s, x) => s + Number(x.grossInterest || 0),
    0
  );
  const totalTds = items.reduce((s, x) => s + Number(x.tdsDeducted || 0), 0);
  const totalNet = items.reduce((s, x) => s + Number(x.netInterest || 0), 0);

  return (
    <section className='ed-card relative'>
      <span className='corner-mark corner-tl' />
      <span className='corner-mark corner-tr' />
      <span className='corner-mark corner-bl' />
      <span className='corner-mark corner-br' />

      <div className='p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Receipt
            className='h-4 w-4 text-[hsl(var(--accent))]'
            strokeWidth={1.5}
          />
          <h2 className='font-serif text-[20px] text-foreground leading-none'>
            TDS Summary
          </h2>
          <span className='eyebrow ml-1'>per financial year</span>
        </div>
        <div className='flex items-center gap-1.5 flex-wrap'>
          {availableYears.length > 0 ? (
            <>
              <PeriodBadge
                label='All'
                active={!financialYear}
                onClick={() => onYearChange('')}
              />
              {availableYears.map(y => (
                <PeriodBadge
                  key={y}
                  label={String(y)}
                  active={String(financialYear) === String(y)}
                  onClick={() => onYearChange(String(y))}
                />
              ))}
            </>
          ) : null}
        </div>
      </div>

      <div className='p-5'>
        {isLoading && availableYears.length === 0 ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='h-5 w-5 animate-spin text-primary' />
          </div>
        ) : items.length === 0 ? (
          <p className='text-[13px] text-muted-foreground text-center py-8'>
            No interest recorded for this financial year yet.
          </p>
        ) : (
          <>
            <div className='grid grid-cols-3 gap-4 mb-5'>
              <div className='border border-border/60 rounded-sm px-4 py-3'>
                <p className='eyebrow text-muted-foreground'>Gross Interest</p>
                <p className='font-mono text-[15px] font-semibold'>
                  {formatCurrency(totalGross)}
                </p>
              </div>
              <div className='border border-border/60 rounded-sm px-4 py-3'>
                <p className='eyebrow text-muted-foreground'>TDS Deducted</p>
                <p className='font-mono text-[15px] font-semibold text-[hsl(var(--loss))]'>
                  −{formatCurrency(totalTds)}
                </p>
              </div>
              <div className='border border-border/60 rounded-sm px-4 py-3'>
                <p className='eyebrow text-muted-foreground'>Net Interest</p>
                <p className='font-mono text-[15px] font-semibold text-[hsl(var(--gain))]'>
                  {formatCurrency(totalNet)}
                </p>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='border-b border-border bg-muted/30'>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground'>
                      Bank / FD
                    </th>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right'>
                      Gross Interest
                    </th>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right'>
                      Threshold
                    </th>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right'>
                      Taxable
                    </th>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-center'>
                      Rate
                    </th>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right'>
                      TDS
                    </th>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-right'>
                      Net
                    </th>
                    <th className='py-2 px-4 font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground text-center'>
                      Exemption
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(x => (
                    <TdsRow key={`${x.fdId}-${x.financialYear}`} item={x} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className='text-[10.5px] text-muted-foreground/70 leading-tight mt-4 space-y-1.5'>
              <p>
                The exemption threshold (₹50k regular / ₹1L senior citizen) is
                applied to the combined gross interest of all deposits held at
                the same bank. Where a 15G/15H is submitted, TDS is nil on that
                deposit; otherwise the 10% (PAN) or 20% (no PAN) rate applies.
              </p>
              <p>
                TDS here is the amount the bank withholds on interest{' '}
                <span className='text-muted-foreground'>accrued that year</span>
                . For cumulative FDs this is deducted yearly on accrual even
                though no interest is paid out until maturity.
              </p>
              <p>
                This is <span className='text-muted-foreground'>not</span> your
                final tax liability — it is provisional tax already collected.
                Depending on your slab you may owe more (via advance tax /
                self-assessment) or claim it back. Reconcile it in your ITR.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default TdsSummarySection;
