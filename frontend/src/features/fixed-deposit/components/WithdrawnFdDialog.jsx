'use client';

import { X, Clock, Landmark } from 'lucide-react';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount)))
    return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function fmtPercent(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  return `${Number(value)}`;
}

function formatInIndianWords(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return '';
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} Lakh`;
  return '';
}

export default function WithdrawnFdDialog({
  isOpen,
  onClose,
  fd,
  onEdit,
  onEditWithdrawal,
  onDelete,
}) {
  if (!isOpen || !fd) return null;

  const penaltyRate =
    fd.penaltyRateApplied != null
      ? Number(fd.penaltyRateApplied)
      : fd.interestRate != null && fd.effectiveRateApplied != null
        ? Number(fd.interestRate) - Number(fd.effectiveRateApplied)
        : null;
  const interestEarned =
    fd.realizedMaturityAmount != null && fd.issueAmount != null
      ? Number(fd.realizedMaturityAmount) - Number(fd.issueAmount)
      : null;
  const tenorDays =
    fd.withdrawalDate && fd.issueDate
      ? Math.max(
          0,
          Math.round(
            (new Date(fd.withdrawalDate) - new Date(fd.issueDate)) / 86400000
          )
        )
      : null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='ed-card w-full max-w-4xl relative flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-200'>
        <span className='corner-mark corner-tl' />
        <span className='corner-mark corner-tr' />
        <span className='corner-mark corner-bl' />
        <span className='corner-mark corner-br' />

        <div className='flex items-center justify-between p-6 border-b border-border'>
          <div>
            <h2 className='font-serif text-[24px] text-foreground leading-none mb-1'>
              Premature Withdrawal Record
            </h2>
            <p className='text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]'>
              {fd.place} · FD #{fd.fdNo}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border bg-orange-500/10 text-orange-500 border-orange-500/30'>
              <Clock className='h-2.5 w-2.5' /> PREMATURELY WITHDRAWN
            </span>
            <button
              onClick={onClose}
              className='w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='p-6 overflow-y-auto space-y-5'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Deposit card */}
            <div className='border border-hairline rounded-sm px-4 py-3'>
              <p className='eyebrow text-muted-foreground mb-2.5 flex items-center gap-1.5'>
                <Landmark className='h-3 w-3' /> Deposit
              </p>
              <div className='grid grid-cols-2 gap-x-4 gap-y-2.5'>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Invested
                  </p>
                  <p className='font-mono text-[14px] font-medium'>
                    {formatCurrency(fd.issueAmount)}
                  </p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Contracted Rate
                  </p>
                  <p className='font-mono text-[14px] font-medium'>
                    {fmtPercent(fd.interestRate)}% p.a.
                  </p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Issue Date
                  </p>
                  <p className='font-mono text-[13px]'>{fd.issueDate}</p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Maturity Date
                  </p>
                  <p className='font-mono text-[13px]'>{fd.maturityDate}</p>
                </div>
              </div>
              <div className='mt-3 pt-3 border-t border-border/60 space-y-0.5'>
                <p className='text-[12px] text-muted-foreground'>
                  Holder:{' '}
                  <span className='text-foreground'>{fd.holderName}</span>
                </p>
                {fd.accountNumber && (
                  <p className='text-[12px] font-mono text-muted-foreground'>
                    A/C:{' '}
                    <span className='text-foreground'>{fd.accountNumber}</span>
                  </p>
                )}
                {fd.investmentPeriod && (
                  <p className='text-[12px] font-mono text-muted-foreground'>
                    Tenure:{' '}
                    <span className='text-foreground'>
                      {fd.investmentPeriod}
                    </span>
                  </p>
                )}
                {fd.nominee && (
                  <p className='text-[12px] text-muted-foreground'>
                    Nominee:{' '}
                    <span className='text-foreground'>{fd.nominee}</span>
                  </p>
                )}
                {fd.remarks && (
                  <p className='text-[12px] text-muted-foreground italic line-clamp-2'>
                    "{fd.remarks}"
                  </p>
                )}
              </div>
            </div>

            {/* Withdrawal card */}
            <div className='border border-[hsl(var(--loss))]/30 bg-[hsl(var(--loss))]/5 rounded-sm px-4 py-3'>
              <p className='eyebrow text-muted-foreground mb-1'>Withdrawn On</p>
              <p className='font-mono text-[15px] font-semibold text-[hsl(var(--loss))]'>
                {fd.withdrawalDate || '—'}
              </p>

              <div className='mt-3 pt-3 border-t border-border/60 space-y-2.5'>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Realized Amount
                  </p>
                  <p className='font-mono text-[20px] font-bold text-[hsl(var(--gain))] leading-tight'>
                    {formatCurrency(fd.realizedMaturityAmount)}
                  </p>
                  {formatInIndianWords(fd.realizedMaturityAmount) && (
                    <p className='text-[11px] font-mono text-muted-foreground/70'>
                      {formatInIndianWords(fd.realizedMaturityAmount)}
                    </p>
                  )}
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <p className='text-[11px] text-foreground/70'>Tenor</p>
                  <p className='font-mono text-[13px] font-medium'>
                    {tenorDays != null ? `${tenorDays} days` : '—'}
                  </p>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <p className='text-[11px] text-foreground/70'>
                    Effective Rate
                  </p>
                  <p className='font-mono text-[13px] font-semibold text-[hsl(var(--accent))]'>
                    {fmtPercent(fd.effectiveRateApplied)}% p.a.
                  </p>
                </div>
                {penaltyRate != null && penaltyRate > 0 && (
                  <div className='flex items-center justify-between gap-3'>
                    <p className='text-[11px] text-foreground/70'>
                      Penalty Applied
                    </p>
                    <p className='font-mono text-[13px] text-[hsl(var(--loss))]'>
                      −{fmtPercent(penaltyRate)}% p.a.
                    </p>
                  </div>
                )}
                <div className='flex items-center justify-between gap-3'>
                  <p className='text-[11px] text-foreground/70'>
                    Interest Foregone
                  </p>
                  <p className='font-mono text-[13px] text-[hsl(var(--loss))]'>
                    −{formatCurrency(Math.abs(Number(fd.penaltyAmount || 0)))}
                  </p>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <p className='text-[11px] text-foreground/70'>
                    Interest Earned
                  </p>
                  <p className='font-mono text-[13px] font-semibold text-[hsl(var(--gain))]'>
                    {interestEarned != null
                      ? `+${formatCurrency(interestEarned)}`
                      : '—'}
                  </p>
                </div>
                <div className='flex items-center justify-between gap-3 border-t border-border/60 pt-2.5'>
                  <p className='eyebrow text-muted-foreground'>
                    Original Maturity Value
                  </p>
                  <p className='font-mono text-[13px] text-muted-foreground'>
                    {formatCurrency(fd.maturityAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center justify-between border border-[hsl(var(--loss))]/20 bg-muted/20 rounded-sm px-4 py-3'>
            <div>
              <p className='eyebrow text-muted-foreground mb-0.5'>Status</p>
              <p className='text-[13px] text-foreground'>
                Prematurely withdrawn on{' '}
                <span className='font-mono'>{fd.withdrawalDate}</span> —{' '}
                {penaltyRate != null
                  ? `penalized at ${fmtPercent(penaltyRate)}% p.a. below the certificate rate`
                  : 'redeemed before the original maturity date'}
                .
              </p>
            </div>
          </div>
        </div>

        <div className='p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='ed-btn bg-card border-border hover:bg-muted text-foreground'
            >
              Close
            </button>
            {onDelete && (
              <button
                type='button'
                onClick={() => onDelete(fd)}
                className='ed-btn border-[hsl(var(--loss))]/40 text-[hsl(var(--loss))] hover:bg-[hsl(var(--loss))]/5'
              >
                Delete
              </button>
            )}
          </div>
          <div className='flex items-center gap-3'>
            {onEdit && (
              <button
                type='button'
                onClick={() => onEdit(fd)}
                className='ed-btn bg-card border-border hover:bg-muted text-foreground'
              >
                Edit Details
              </button>
            )}
            {onEditWithdrawal && (
              <button
                type='button'
                onClick={() => onEditWithdrawal(fd)}
                className='ed-btn ed-btn-accent min-w-[120px]'
              >
                Edit Withdrawal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
