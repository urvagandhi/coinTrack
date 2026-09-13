'use client';

import { useState } from 'react';
// [DEPRECATED-SEC-04-05] ArrowRightLeft is only used by the commented senior-citizen notice below.
import { Loader2, X, Calendar } from 'lucide-react';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount)))
    return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function fmtPercent(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  return `${Number(value)}%`;
}

function formatInIndianWords(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return '';
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} Lakh`;
  return '';
}

export default function WithdrawDialog({ isOpen, onClose, fd, onWithdrawn }) {
  const [withdrawalDate, setWithdrawalDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const isResult = !!result;

  const handleClose = () => {
    setResult(null);
    setWithdrawalDate('');
    onClose();
  };

  const handleWithdraw = async () => {
    if (!withdrawalDate) return;
    setIsLoading(true);
    try {
      const res = await onWithdrawn(withdrawalDate);
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !fd) return null;

  const diff = formatCurrency(result.realizedMaturityAmount);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='ed-card w-full max-w-lg relative flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-200'>
        <span className='corner-mark corner-tl' />
        <span className='corner-mark corner-tr' />
        <span className='corner-mark corner-bl' />
        <span className='corner-mark corner-br' />

        <div className='flex items-center justify-between p-6 border-b border-border'>
          <div>
            <h2 className='font-serif text-[24px] text-foreground leading-none mb-1'>
              Premature Withdrawal
            </h2>
            <p className='text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]'>
              {fd.place} · FD #{fd.fdNo}
            </p>
          </div>
          <button
            onClick={handleClose}
            className='w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto space-y-5'>
          {!isResult ? (
            <div className='space-y-4'>
              {fd.isPrematurelyWithdrawn ? (
                <div className='border border-[hsl(var(--loss))]/40 bg-[hsl(var(--loss))]/5 rounded-sm px-4 py-3 text-[13px] text-foreground'>
                  This FD has already been withdrawn prematurely on{' '}
                  <span className='font-mono'>{fd.withdrawalDate}</span>.
                </div>
              ) : (
                <>
                  <div className='grid grid-cols-2 gap-4'>
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

                  <div className='space-y-1.5'>
                    <label className='eyebrow flex items-center gap-1.5'>
                      <Calendar className='h-3 w-3' /> Withdrawal Date *
                    </label>
                    <input
                      type='date'
                      required
                      value={withdrawalDate}
                      min={fd.issueDate}
                      max={fd.maturityDate}
                      onChange={e => setWithdrawalDate(e.target.value)}
                      className='ed-input w-full font-mono'
                    />
                    <p className='text-[10.5px] text-muted-foreground/80 leading-tight'>
                      Withdrawal date must fall between issue and maturity date.
                      A penalized rate is applied for closing before maturity.
                    </p>
                  </div>

                  {/* [DEPRECATED-SEC-04-05] Senior-citizen notice is DISABLED along with the isSeniorCitizen
                    field (sections 04/05) and the whole TDS feature it referenced. Re-enable with
                    the field + TDS to restore.
                    {fd.isSeniorCitizen && (
                      <div className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                        <ArrowRightLeft className='h-3 w-3' />
                        Senior citizen profile detected — TDS threshold applies at
                        bank level on realized interest.
                      </div>
                    )}
                  */}
                </>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 rounded-sm px-4 py-3'>
                <div>
                  <p className='eyebrow text-muted-foreground'>
                    Realized Amount
                  </p>
                  <p className='font-mono text-[18px] font-bold text-[hsl(var(--gain))]'>
                    {formatCurrency(result.realizedMaturityAmount)}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='eyebrow text-muted-foreground'>Tenor</p>
                  <p className='font-mono text-[13px] font-medium'>
                    {result.actualTenorDays} days
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Contracted Rate
                  </p>
                  <p className='font-mono text-[13px]'>
                    {fmtPercent(result.contractedRate)}% p.a.
                  </p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Penalty Rate
                  </p>
                  <p className='font-mono text-[13px] text-[hsl(var(--loss))]'>
                    {fmtPercent(result.penaltyRate)}% p.a.
                  </p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Applicable Rate
                  </p>
                  <p className='font-mono text-[13px]'>
                    {fmtPercent(result.applicableRate)}% p.a.
                  </p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Effective Rate
                  </p>
                  <p className='font-mono text-[13px] font-medium text-[hsl(var(--accent))]'>
                    {fmtPercent(result.effectiveRate)}% p.a.
                  </p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Contracted Maturity
                  </p>
                  <p className='font-mono text-[13px]'>
                    {formatCurrency(result.contractedMaturityAmount)}
                  </p>
                </div>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Penalty Amount
                  </p>
                  <p className='font-mono text-[13px] text-[hsl(var(--loss))]'>
                    −{Math.abs(Number(result.penaltyAmount || 0)).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className='flex items-center justify-between border-t border-border/60 pt-3'>
                <div>
                  <p className='eyebrow text-muted-foreground mb-0.5'>
                    Interest Earned (net of penalty)
                  </p>
                  <p className='font-mono text-[14px] font-semibold text-[hsl(var(--gain))]'>
                    +{formatCurrency(result.interestEarned)}
                  </p>
                </div>
                {diff && formatInIndianWords(result.realizedMaturityAmount) && (
                  <span className='text-[11px] font-mono text-muted-foreground'>
                    {formatInIndianWords(result.realizedMaturityAmount)}
                  </span>
                )}
              </div>

              <p className='text-[10.5px] text-muted-foreground/70 leading-tight'>
                Bank-level TDS on interest accrued this financial year may still
                be withheld and is not reflected above — it is provisional, not
                your final tax liability. Reconcile via ITR.
              </p>
            </div>
          )}
        </div>

        <div className='p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto'>
          <button
            type='button'
            onClick={handleClose}
            disabled={isLoading}
            className='ed-btn bg-card border-border hover:bg-muted text-foreground'
          >
            {isResult ? 'Done' : 'Cancel'}
          </button>
          {!isResult && !fd.isPrematurelyWithdrawn && (
            <button
              type='button'
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawalDate}
              className='ed-btn bg-[hsl(var(--loss))] text-white hover:opacity-90 disabled:opacity-50 min-w-[140px]'
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Confirm Withdraw'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
