'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, X, Calendar, Percent, RotateCcw } from 'lucide-react';
import {
  describeBankPenalty,
  normalisePenaltyOverride,
} from '@/lib/bankPenalty';

function daysBetweenIso(isoFrom, isoTo) {
  if (!isoFrom || !isoTo) return null;
  const from = Date.parse(`${isoFrom}T00:00:00Z`);
  const to = Date.parse(`${isoTo}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86400000);
}

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
  return `${Number(value)}`;
}

function formatInIndianWords(amount) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return '';
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} Lakh`;
  return '';
}

export default function WithdrawDialog({
  isOpen,
  onClose,
  fd,
  onWithdrawn,
  onPreview,
}) {
  const [withdrawalDate, setWithdrawalDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCommitted, setIsCommitted] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [penaltyTouched, setPenaltyTouched] = useState(false);
  const [penaltyValue, setPenaltyValue] = useState('');
  const previewReq = useRef(0);
  const onPreviewRef = useRef(onPreview);
  useEffect(() => {
    onPreviewRef.current = onPreview;
  }, [onPreview]);

  const tenorDays = useMemo(
    () => daysBetweenIso(fd?.issueDate, withdrawalDate),
    [fd, withdrawalDate]
  );

  const { rate: bankDefaultPenalty, source: bankDefaultSource } = useMemo(
    () => describeBankPenalty(fd?.place, fd?.issueAmount, tenorDays),
    [fd, tenorDays]
  );

  const penaltyDisplay = penaltyTouched
    ? penaltyValue
    : String(bankDefaultPenalty);

  const penaltyOverride = useMemo(
    () =>
      normalisePenaltyOverride(
        penaltyDisplay,
        fd?.place,
        fd?.issueAmount,
        tenorDays,
        fd?.interestRate
      ),
    [penaltyDisplay, fd, tenorDays]
  );

  useEffect(() => {
    if (isOpen && fd?.id) {
      if (fd.isPrematurelyWithdrawn) {
        setWithdrawalDate(fd.withdrawalDate || '');
        if (fd.penaltyRateApplied != null) {
          setPenaltyTouched(true);
          setPenaltyValue(String(fd.penaltyRateApplied));
        } else {
          const initial = describeBankPenalty(
            fd.place,
            fd.issueAmount,
            null
          ).rate;
          setPenaltyTouched(false);
          setPenaltyValue(String(initial));
        }
      } else {
        setWithdrawalDate('');
        const initial = describeBankPenalty(
          fd.place,
          fd.issueAmount,
          null
        ).rate;
        setPenaltyTouched(false);
        setPenaltyValue(String(initial));
      }
    }
  }, [
    isOpen,
    fd?.id,
    fd?.place,
    fd?.issueAmount,
    fd?.isPrematurelyWithdrawn,
    fd?.penaltyRateApplied,
    fd?.withdrawalDate,
  ]);

  useEffect(() => {
    if (isCommitted) return undefined;
    if (!withdrawalDate || !onPreviewRef.current) {
      previewReq.current += 1;
      setResult(null);
      setIsPreviewing(false);
      setError(null);
      return undefined;
    }
    const reqId = ++previewReq.current;
    setResult(null);
    setError(null);
    setIsPreviewing(true);
    const timer = setTimeout(async () => {
      try {
        const res = await onPreviewRef.current(withdrawalDate, penaltyOverride);
        if (previewReq.current === reqId) setResult(res);
      } catch (err) {
        if (previewReq.current === reqId) {
          setResult(null);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Could not preview withdrawal'
          );
        }
      } finally {
        if (previewReq.current === reqId) setIsPreviewing(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [withdrawalDate, penaltyOverride, isCommitted]);

  const handleClose = () => {
    previewReq.current += 1;
    setIsCommitted(false);
    setIsPreviewing(false);
    setResult(null);
    setError(null);
    setWithdrawalDate('');
    setPenaltyTouched(false);
    setPenaltyValue('');
    onClose();
  };

  const handleWithdraw = async () => {
    if (!withdrawalDate) return;
    previewReq.current += 1;
    setIsLoading(true);
    setError(null);
    try {
      const res = await onWithdrawn(withdrawalDate, penaltyOverride);
      setResult(res);
      setIsCommitted(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to process withdrawal'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !fd) return null;

  const renderResultPanel = () => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 rounded-sm px-5 py-4'>
        <div>
          <p className='eyebrow text-muted-foreground mb-1'>Realized Amount</p>
          <p className='font-mono text-[26px] font-bold text-[hsl(var(--gain))] leading-tight'>
            {formatCurrency(result.realizedMaturityAmount)}
          </p>
          <p className='mt-1 text-[11px] font-mono text-muted-foreground/70'>
            {result.actualTenorDays} days held before redeeming early
          </p>
        </div>
        <div className='text-right flex flex-col items-end gap-2'>
          <span className='text-[11px] font-mono text-foreground/70 bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20 rounded-sm px-2 py-0.5'>
            {formatInIndianWords(result.realizedMaturityAmount)}
          </span>
          <div>
            <p className='eyebrow text-muted-foreground mb-0.5'>Tenor</p>
            <p className='font-mono text-[15px] font-semibold'>
              {result.actualTenorDays} days
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='border border-hairline rounded-sm px-4 py-3'>
          <p className='eyebrow text-muted-foreground mb-3'>
            Withdrawal Timeline
          </p>
          <div className='flex items-start'>
            <div className='flex-none'>
              <span className='block w-2.5 h-2.5 rounded-full bg-[hsl(var(--gain))]' />
              <p className='text-[10.5px] uppercase tracking-[0.05em] text-muted-foreground mt-2 whitespace-nowrap'>
                Issued
              </p>
              <p className='font-mono text-[12px] mt-1'>
                {fd?.issueDate || '—'}
              </p>
            </div>
            <div className='flex-1 border-t border-dashed border-muted-foreground/40 mt-1.5' />
            <div className='flex-none text-center'>
              <span className='block w-2.5 h-2.5 rounded-full bg-[hsl(var(--loss))] mx-auto' />
              <p className='text-[10.5px] uppercase tracking-[0.05em] text-muted-foreground mt-2'>
                Prematurely Withdrawn
              </p>
              <p className='font-mono text-[12px] mt-1 text-[hsl(var(--loss))]'>
                {result.withdrawalDate || '—'}
              </p>
            </div>
            <div className='flex-1 border-t border-dashed border-muted-foreground/40 mt-1.5' />
            <div className='flex-none text-right'>
              <span className='block w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))] ml-auto' />
              <p className='text-[10.5px] uppercase tracking-[0.05em] text-muted-foreground mt-2 whitespace-nowrap'>
                Original Maturity
              </p>
              <p className='font-mono text-[12px] mt-1'>
                {fd?.maturityDate || '—'}
              </p>
            </div>
          </div>
          <p className='mt-2.5 text-[11px] font-mono text-muted-foreground/80 text-center'>
            {result.actualTenorDays} days held before redeeming early
          </p>
        </div>

        <div className='border border-hairline rounded-sm px-4 py-3'>
          <p className='eyebrow text-muted-foreground mb-3'>Rate Breakdown</p>
          <div className='space-y-2.5'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-[11px] text-foreground/70'>Certificate Rate</p>
              <p className='font-mono text-[13px] font-medium'>
                {fmtPercent(result.contractedRate)}% p.a.
              </p>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-[11px] text-foreground/70'>
                Early-Withdrawal Penalty
              </p>
              <p className='font-mono text-[13px] font-medium text-[hsl(var(--loss))]'>
                −{fmtPercent(result.penaltyRate)}% p.a.
              </p>
            </div>
            <div className='flex items-center justify-between gap-3 border-t border-border/60 pt-2.5'>
              <p className='eyebrow text-muted-foreground'>Effective Rate</p>
              <p className='font-mono text-[14px] font-bold text-[hsl(var(--accent))]'>
                {fmtPercent(result.effectiveRate)}% p.a.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='border border-hairline rounded-sm px-4 py-3'>
          <p className='eyebrow text-muted-foreground mb-1'>
            If Held to Maturity
          </p>
          <p className='font-mono text-[16px] font-semibold'>
            {formatCurrency(result.contractedMaturityAmount)}
          </p>
          <p className='mt-1 text-[10.5px] text-muted-foreground/70 leading-tight'>
            expected value on the original maturity date
          </p>
        </div>
        <div className='border border-hairline rounded-sm px-4 py-3'>
          <p className='eyebrow text-muted-foreground mb-1'>
            Interest Foregone
          </p>
          <p className='font-mono text-[16px] font-semibold text-[hsl(var(--loss))]'>
            −{formatCurrency(Math.abs(Number(result.penaltyAmount || 0)))}
          </p>
          <p className='mt-1 text-[10.5px] text-muted-foreground/70 leading-tight'>
            what you gave up by redeeming early
          </p>
        </div>
      </div>

      <div className='flex items-center justify-between border border-[hsl(var(--gain))]/25 bg-[hsl(var(--gain))]/5 rounded-sm px-4 py-3'>
        <div>
          <p className='eyebrow text-muted-foreground mb-0.5'>
            Interest Earned (net of penalty)
          </p>
          <p className='font-mono text-[16px] font-bold text-[hsl(var(--gain))]'>
            +{formatCurrency(result.interestEarned)}
          </p>
        </div>
        <span className='text-[11px] font-mono text-muted-foreground/70'>
          {formatInIndianWords(result.interestEarned)}
        </span>
      </div>

      <p className='text-[10.5px] text-muted-foreground/70 leading-tight'>
        Bank-level TDS on interest accrued this financial year may still be
        withheld and is not reflected above — it is provisional, not your final
        tax liability. Reconcile via ITR.
      </p>
    </div>
  );

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
              {fd.isPrematurelyWithdrawn
                ? 'Edit Withdrawal'
                : 'Premature Withdrawal'}
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
          {fd.isPrematurelyWithdrawn ? (
            <div className='border border-[hsl(var(--loss))]/40 bg-[hsl(var(--loss))]/5 rounded-sm px-4 py-3 text-[13px] text-foreground'>
              This FD is already withdrawn prematurely on{' '}
              <span className='font-mono'>{fd.withdrawalDate}</span>. Adjust the
              date or penalty below to correct the record.
            </div>
          ) : null}
          {(() => {
            const body = (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='border border-hairline rounded-sm px-4 py-3'>
                    <p className='eyebrow text-muted-foreground mb-2.5'>
                      Fixed Deposit
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
                        <p className='font-mono text-[13px]'>
                          {fd.maturityDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='border border-hairline rounded-sm px-4 py-3'>
                      <label className='eyebrow flex items-center gap-1.5 mb-2.5'>
                        <Calendar className='h-3 w-3' /> Withdrawal Date *
                      </label>
                      <input
                        type='date'
                        required
                        value={withdrawalDate}
                        min={fd.issueDate}
                        max={fd.maturityDate}
                        disabled={isCommitted}
                        onChange={e => setWithdrawalDate(e.target.value)}
                        className='ed-input w-full font-mono disabled:opacity-60'
                      />
                      <p className='mt-1.5 text-[10.5px] text-muted-foreground/80 leading-tight'>
                        Withdrawal date must fall between issue and maturity
                        date. A penalized rate is applied for closing before
                        maturity.
                      </p>
                    </div>

                    <div className='border border-hairline rounded-sm px-4 py-3'>
                      <label className='eyebrow flex items-center gap-1.5 mb-2.5'>
                        <Percent className='h-3 w-3' /> Penalty Rate *
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          type='number'
                          required
                          inputMode='decimal'
                          step='0.05'
                          min='0'
                          max={fd.interestRate}
                          value={penaltyDisplay}
                          disabled={isCommitted}
                          onChange={e => {
                            setPenaltyTouched(true);
                            setPenaltyValue(e.target.value);
                          }}
                          className='ed-input w-full font-mono disabled:opacity-60'
                          placeholder={String(bankDefaultPenalty)}
                        />
                        <button
                          type='button'
                          title='Reset to bank default'
                          onClick={() => {
                            setPenaltyTouched(false);
                            setPenaltyValue(String(bankDefaultPenalty));
                          }}
                          className={`flex-none w-9 h-9 flex items-center justify-center rounded-sm border transition-all ${
                            penaltyTouched
                              ? 'border-border hover:bg-muted text-foreground'
                              : 'border-hairline text-muted-foreground/40 cursor-default'
                          }`}
                        >
                          <RotateCcw className='h-3.5 w-3.5' />
                        </button>
                      </div>
                      <p className='mt-1.5 text-[10.5px] text-muted-foreground/80 leading-tight'>
                        Bank default{' '}
                        <span className='font-mono text-foreground/90'>
                          {bankDefaultPenalty}%
                        </span>{' '}
                        — {bankDefaultSource}
                        {tenorDays != null && (
                          <span className='font-mono text-muted-foreground/70'>
                            {' '}
                            (auto-adjusts by held days)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {isPreviewing && !result && (
                  <p className='text-[12px] font-mono text-muted-foreground flex items-center gap-2'>
                    <Loader2 className='h-3 w-3 animate-spin' /> Calculating
                    preview…
                  </p>
                )}

                {result && !isCommitted && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <p className='eyebrow text-[hsl(var(--accent))]'>
                        Projected — not yet processed
                      </p>
                      <span className='text-[10.5px] font-mono text-muted-foreground/70'>
                        refreshes as you change the date
                      </span>
                    </div>
                    {renderResultPanel()}
                  </div>
                )}

                {isCommitted && (
                  <div className='space-y-3'>
                    <p className='eyebrow text-[hsl(var(--gain))]'>
                      {fd.isPrematurelyWithdrawn
                        ? `Record updated on ${result?.withdrawalDate || withdrawalDate}`
                        : `Processed on ${result?.withdrawalDate || withdrawalDate} — FD
                    marked as withdrawn`}
                    </p>
                    {renderResultPanel()}
                  </div>
                )}

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
            );
            return body;
          })()}
        </div>

        {error && (
          <div className='px-6 pb-3'>
            <div className='border border-[hsl(var(--loss))]/40 bg-[hsl(var(--loss))]/5 rounded-sm px-3 py-2 text-[12px] text-foreground'>
              {error}
            </div>
          </div>
        )}

        <div className='p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto'>
          <button
            type='button'
            onClick={handleClose}
            disabled={isLoading}
            className='ed-btn bg-card border-border hover:bg-muted text-foreground'
          >
            {isCommitted ? 'Done' : 'Cancel'}
          </button>
          {!isCommitted && (
            <button
              type='button'
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawalDate}
              className='ed-btn bg-[hsl(var(--loss))] text-white hover:opacity-90 disabled:opacity-50 min-w-[140px]'
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : fd.isPrematurelyWithdrawn ? (
                'Update Withdrawal'
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
