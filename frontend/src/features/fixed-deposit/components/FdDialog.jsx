'use client';

import { useToast } from '@/shared/ui/feedback/use-toast';
import { Loader2, X, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/auth/AuthContext';
import BankSearchCombobox from '@/shared/ui/search/BankSearchCombobox';

const INITIAL_STATE = {
  place: '',
  holderName: '',
  accountNumber: '',
  interestRate: '',
  issueDate: '',
  maturityDate: '',
  investmentPeriod: '',
  issueAmount: '',
  maturityAmount: '',
  nominee: '',
  remarks: '',
  // [DEPRECATED-SEC-04-05] Interest Structure / Eligibility fields are DISABLED along with the
  // commented Sections 04/05 JSX below. fdType/compoundingFrequency defaults are now folded into
  // the maturity-estimate helpers (CUMULATIVE / QUARTERLY), and nothing is sent to the backend.
  // fdType: 'CUMULATIVE',
  // compoundingFrequency: 'QUARTERLY',
  // payoutFrequency: 'AT_MATURITY',
  // isSeniorCitizen: false,
  // isTaxSaver: false,
};

const COMPOUNDING_PERIODS = {
  MONTHLY: 12,
  QUARTERLY: 4,
  HALF_YEARLY: 2,
  YEARLY: 1,
};

// [DEPRECATED-SEC-04-05] FD Type / Compounding / Payout option lists are DISABLED with sections
// 04/05; referenced only by the commented JSX below. Re-enable together with that block.
// const FD_TYPE_OPTIONS = [
//   { value: 'CUMULATIVE', label: 'Cumulative' },
//   { value: 'NON_CUMULATIVE', label: 'Non-Cumulative' },
// ];
//
// const COMPOUNDING_OPTIONS = [
//   { value: 'MONTHLY', label: 'Monthly' },
//   { value: 'QUARTERLY', label: 'Quarterly' },
//   { value: 'HALF_YEARLY', label: 'Half-Yearly' },
//   { value: 'YEARLY', label: 'Yearly' },
// ];
//
// const PAYOUT_OPTIONS = [
//   { value: 'MONTHLY', label: 'Monthly' },
//   { value: 'QUARTERLY', label: 'Quarterly' },
//   { value: 'HALF_YEARLY', label: 'Half-Yearly' },
//   { value: 'YEARLY', label: 'Yearly' },
//   { value: 'AT_MATURITY', label: 'At Maturity' },
// ];

/**
 * Format currency in Indian standard (en-IN)
 */
function formatIndianCurrency(amount) {
  if (amount === null || amount === undefined || amount === '' || isNaN(amount))
    return '';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Helper to display amounts in Indian words (Lakh / Crore)
 */
function formatInIndianWords(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return '';
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} Lakh`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return '';
}

/**
 * Helper to parse amount shortcuts (e.g. 5L -> 500000)
 */
function parseShortcutAmount(val) {
  if (!val) return '';
  const clean = val.toString().trim().replace(/,/g, '');

  // Lakhs
  if (/[lL]$/i.test(clean)) {
    const num = parseFloat(clean.substring(0, clean.length - 1));
    if (!isNaN(num)) return String(num * 100000);
  }
  // Crores
  if (/cr$/i.test(clean)) {
    const num = parseFloat(clean.substring(0, clean.length - 2));
    if (!isNaN(num)) return String(num * 10000000);
  }
  // Thousands
  if (/[kK]$/i.test(clean)) {
    const num = parseFloat(clean.substring(0, clean.length - 1));
    if (!isNaN(num)) return String(num * 1000);
  }
  return val;
}

/**
 * Calculate human-readable tenure (Years, Months, Days) from dates.
 * Decomposes via whole calendar months (dropping one when the end
 * day-of-month is smaller than the start), then counts exact leftover days,
 * so the text always agrees with the trailing total-day count.
 */
function calculateTenurePeriod(issueDate, maturityDate) {
  if (!issueDate || !maturityDate) return '';
  const start = new Date(issueDate);
  const end = new Date(maturityDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return '';

  const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;

  let monthsAfterStart = new Date(
    start.getFullYear(),
    start.getMonth() + months,
    start.getDate()
  );
  let days = Math.round((end - monthsAfterStart) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    months -= 1;
    monthsAfterStart = new Date(
      start.getFullYear(),
      start.getMonth() + months,
      start.getDate()
    );
    days = Math.round((end - monthsAfterStart) / (1000 * 60 * 60 * 24));
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  if (remMonths > 0)
    parts.push(`${remMonths} ${remMonths === 1 ? 'Month' : 'Months'}`);
  if (days > 0 || parts.length === 0)
    parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);

  return `${parts.join(', ')} (${totalDays} Days)`;
}

const SIMPLE_INTEREST_THRESHOLD_DAYS = 181;

function daysBetween(start, end) {
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Simple interest for a given number of days (matching backend non-cumulative math).
 */
function computeSimpleInterest(principal, ratePercent, totalDays) {
  return principal * (ratePercent / 100) * (totalDays / 365);
}

/**
 * Cumulative compounding with a configurable frequency, mirroring the server
 * FdMath: compound over full periods, add simple interest for the broken tail.
 */
function computeCumulativeInterest(principal, ratePercent, totalDays, freq) {
  if (totalDays < SIMPLE_INTEREST_THRESHOLD_DAYS) {
    return computeSimpleInterest(principal, ratePercent, totalDays);
  }

  const n = COMPOUNDING_PERIODS[freq] ?? 4;
  const periodicRate = ratePercent / 100 / n;

  const fullYears = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const fullPeriodsInRemaining = Math.floor((remainingDays * n) / 365);
  const brokenDays =
    remainingDays - Math.floor((fullPeriodsInRemaining * 365) / n);

  const totalPeriods = fullYears * n + fullPeriodsInRemaining;
  const amountAfterFullPeriods =
    principal * Math.pow(1 + periodicRate, totalPeriods);

  if (brokenDays > 0) {
    const dailyRate = ratePercent / 100 / 365;
    const brokenInterest = amountAfterFullPeriods * dailyRate * brokenDays;
    return amountAfterFullPeriods + brokenInterest - principal;
  }
  return amountAfterFullPeriods - principal;
}

/**
 * Maturity amount from principal + rate + dates + FD structure.
 */
function calculateFdMaturity(
  issueAmount,
  interestRate,
  issueDate,
  maturityDate,
  fdType = 'CUMULATIVE',
  compoundingFrequency = 'QUARTERLY'
) {
  const P = parseFloat(issueAmount);
  const r = parseFloat(interestRate);
  if (!P || !r || P <= 0 || r <= 0) return null;

  let totalInterest;

  // No dates -> assume 1 year at the selected structure.
  if (!issueDate || !maturityDate) {
    if (fdType === 'NON_CUMULATIVE') {
      totalInterest = computeSimpleInterest(P, r, 365);
    } else {
      const n = COMPOUNDING_PERIODS[compoundingFrequency] ?? 4;
      totalInterest = P * (Math.pow(1 + r / 100 / n, n) - 1);
    }
    return Math.round((P + totalInterest) * 100) / 100;
  }

  const start = new Date(issueDate);
  const end = new Date(maturityDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start)
    return null;

  const totalDays = daysBetween(start, end);

  if (fdType === 'NON_CUMULATIVE') {
    totalInterest = computeSimpleInterest(P, r, totalDays);
  } else {
    totalInterest = computeCumulativeInterest(
      P,
      r,
      totalDays,
      compoundingFrequency
    );
  }

  return Math.round((P + totalInterest) * 100) / 100;
}

/**
 * Reverse-solve for interest rate (% p.a.) given principal, maturity amount and dates.
 */
function calculateFdInterestRate(
  issueAmount,
  maturityAmount,
  issueDate,
  maturityDate,
  fdType = 'CUMULATIVE',
  compoundingFrequency = 'QUARTERLY'
) {
  const P = parseFloat(issueAmount);
  const A = parseFloat(maturityAmount);
  if (!P || !A || P <= 0 || A <= P) return null;

  const targetInterest = A - P;

  if (!issueDate || !maturityDate) {
    if (fdType === 'NON_CUMULATIVE') {
      const rate = (targetInterest * 365 * 100) / (P * 365);
      return Math.round(rate * 100) / 100;
    }
    const n = COMPOUNDING_PERIODS[compoundingFrequency] ?? 4;
    const rate = n * (Math.pow(1 + targetInterest / P, 1 / n) - 1) * 100;
    return Math.round(rate * 100) / 100;
  }

  const start = new Date(issueDate);
  const end = new Date(maturityDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start)
    return null;

  const totalDays = daysBetween(start, end);

  let low = 0.01,
    high = 500,
    bestRate = 0;
  for (let i = 0; i < 120; i++) {
    const mid = (low + high) / 2;
    let testInterest;
    if (fdType === 'NON_CUMULATIVE') {
      testInterest = computeSimpleInterest(P, mid, totalDays);
    } else if (totalDays < SIMPLE_INTEREST_THRESHOLD_DAYS) {
      testInterest = computeSimpleInterest(P, mid, totalDays);
    } else {
      const n = COMPOUNDING_PERIODS[compoundingFrequency] ?? 4;
      const periodicRate = mid / 100 / n;
      const fullYears = Math.floor(totalDays / 365);
      const remainingDays = totalDays % 365;
      const fullPeriodsInRemaining = Math.floor((remainingDays * n) / 365);
      const brokenDays =
        remainingDays - Math.floor((fullPeriodsInRemaining * 365) / n);
      const totalPeriods = fullYears * n + fullPeriodsInRemaining;
      const amountAfterFullPeriods =
        P * Math.pow(1 + periodicRate, totalPeriods);
      if (brokenDays > 0) {
        const dailyRate = mid / 100 / 365;
        testInterest =
          amountAfterFullPeriods * dailyRate * brokenDays +
          (amountAfterFullPeriods - P);
      } else {
        testInterest = amountAfterFullPeriods - P;
      }
    }
    if (P + testInterest >= A) {
      bestRate = mid;
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(bestRate * 100) / 100;
}
export default function FdDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryMode, setEntryMode] = useState('automatic');
  const [formData, setFormData] = useState(INITIAL_STATE);

  useEffect(() => {
    if (isOpen) {
      // Restore the FD's persisted maturity mode (legacy docs without one = AUTOMATIC, matching
      // the server default). Manual records stay Manual on edit so their certificate value is
      // never silently re-computed.
      setEntryMode(
        initialData?.maturityMode === 'MANUAL' ? 'manual' : 'automatic'
      );
      if (initialData) {
        const issueDate = initialData.issueDate || '';
        const maturityDate = initialData.maturityDate || '';
        const period =
          initialData.investmentPeriod ||
          calculateTenurePeriod(issueDate, maturityDate);

        setFormData({
          place: initialData.place || '',
          holderName: initialData.holderName || '',
          accountNumber: initialData.accountNumber || '',
          interestRate:
            initialData.interestRate !== undefined &&
            initialData.interestRate !== null
              ? String(initialData.interestRate)
              : '',
          issueDate,
          maturityDate,
          investmentPeriod: period,
          issueAmount:
            initialData.issueAmount !== undefined &&
            initialData.issueAmount !== null
              ? String(initialData.issueAmount)
              : '',
          maturityAmount:
            initialData.maturityAmount !== undefined &&
            initialData.maturityAmount !== null
              ? String(initialData.maturityAmount)
              : '',
          nominee: initialData.nominee || '',
          remarks: initialData.remarks || '',
          // [DEPRECATED-SEC-04-05] Interest Structure / Eligibility fields are DISABLED (sections
          // 04/05); the dialog no longer tracks or submits them.
          // fdType: initialData.fdType || 'CUMULATIVE',
          // compoundingFrequency: initialData.compoundingFrequency || 'QUARTERLY',
          // payoutFrequency: initialData.payoutFrequency || 'AT_MATURITY',
          // isSeniorCitizen: !!initialData.isSeniorCitizen,
          // isTaxSaver: !!initialData.isTaxSaver,
        });
      } else {
        setFormData({
          ...INITIAL_STATE,
          holderName: user?.name || user?.username || '',
        });
      }
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, user?.name, user?.username]);

  if (!isOpen) return null;

  const calcMaturity = (
    issueAmount,
    interestRate,
    issueDate,
    maturityDate,
    extra = {}
  ) =>
    calculateFdMaturity(
      issueAmount,
      interestRate,
      issueDate,
      maturityDate,
      extra.fdType || formData.fdType || 'CUMULATIVE',
      extra.compoundingFrequency || formData.compoundingFrequency || 'QUARTERLY'
    );

  const calcRate = (
    issueAmount,
    maturityAmount,
    issueDate,
    maturityDate,
    extra = {}
  ) =>
    calculateFdInterestRate(
      issueAmount,
      maturityAmount,
      issueDate,
      maturityDate,
      extra.fdType || formData.fdType || 'CUMULATIVE',
      extra.compoundingFrequency || formData.compoundingFrequency || 'QUARTERLY'
    );

  const handleModeChange = mode => {
    setEntryMode(mode);
    if (mode === 'automatic') {
      setFormData(prev => {
        const mat = calcMaturity(
          prev.issueAmount,
          prev.interestRate,
          prev.issueDate,
          prev.maturityDate,
          prev
        );
        return mat !== null ? { ...prev, maturityAmount: String(mat) } : prev;
      });
    }
  };

  const triggerRateCalculation = (currData = formData) => {
    const rate = calcRate(
      currData.issueAmount,
      currData.maturityAmount,
      currData.issueDate,
      currData.maturityDate,
      currData
    );
    if (rate !== null) {
      setFormData(prev => ({ ...prev, interestRate: String(rate) }));
      toast({
        title: 'Rate Calculated',
        description: `Calculated Interest Rate: ${rate}% p.a.`,
      });
    } else {
      toast({
        title: 'Calculation Notice',
        description:
          'Please enter valid Issue Amount, Maturity Amount (> Issue Amount), and Dates.',
        variant: 'warning',
      });
    }
  };

  const handleIssueAmountChange = e => {
    const val = e.target.value;
    const parsedVal = parseShortcutAmount(val);
    setFormData(prev => {
      const next = { ...prev, issueAmount: parsedVal };
      if (
        entryMode === 'automatic' &&
        next.interestRate &&
        next.issueDate &&
        next.maturityDate
      ) {
        const mat = calcMaturity(
          parsedVal,
          next.interestRate,
          next.issueDate,
          next.maturityDate,
          next
        );
        if (mat !== null) next.maturityAmount = String(mat);
      }
      return next;
    });
  };

  const handleInterestRateChange = e => {
    const val = e.target.value;
    setFormData(prev => {
      const next = { ...prev, interestRate: val };
      if (
        entryMode === 'automatic' &&
        next.issueAmount &&
        next.issueDate &&
        next.maturityDate
      ) {
        const mat = calcMaturity(
          next.issueAmount,
          val,
          next.issueDate,
          next.maturityDate,
          next
        );
        if (mat !== null) next.maturityAmount = String(mat);
      }
      return next;
    });
  };

  const handleMaturityAmountChange = e => {
    // Manual mode trusts the user: the typed certificate value is stored verbatim and the
    // interest rate is NEVER recomputed from it. The server only validates (and preserves the
    // manual value unless it is edited on the certificate).
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      maturityAmount: parseShortcutAmount(val),
    }));
  };

  const handleDateChange = (field, val) => {
    setFormData(prev => {
      const next = { ...prev, [field]: val };
      const tenure = calculateTenurePeriod(next.issueDate, next.maturityDate);
      next.investmentPeriod = tenure;

      if (entryMode === 'automatic') {
        if (
          next.issueAmount &&
          next.interestRate &&
          next.issueDate &&
          next.maturityDate
        ) {
          const mat = calcMaturity(
            next.issueAmount,
            next.interestRate,
            next.issueDate,
            next.maturityDate,
            next
          );
          if (mat !== null) next.maturityAmount = String(mat);
        } else if (
          next.issueAmount &&
          next.maturityAmount &&
          next.issueDate &&
          next.maturityDate
        ) {
          const rate = calcRate(
            next.issueAmount,
            next.maturityAmount,
            next.issueDate,
            next.maturityDate,
            next
          );
          if (rate !== null) next.interestRate = String(rate);
        }
      }
      return next;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.place ||
      !formData.holderName ||
      !formData.interestRate ||
      !formData.issueDate ||
      !formData.maturityDate ||
      !formData.issueAmount
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.maturityDate) <= new Date(formData.issueDate)) {
      toast({
        title: 'Validation Error',
        description: 'Maturity date must be after issue date.',
        variant: 'destructive',
      });
      return;
    }

    const issueAmountNum = Number(formData.issueAmount);
    const rateNum = Number(formData.interestRate);
    if (isNaN(issueAmountNum) || !(issueAmountNum > 0)) {
      toast({
        title: 'Validation Error',
        description:
          'Initial / Issue Amount must be a valid number greater than 0.',
        variant: 'destructive',
      });
      return;
    }
    if (isNaN(rateNum) || !(rateNum > 0)) {
      toast({
        title: 'Validation Error',
        description: 'Interest Rate must be a valid number greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    let maturityForSend;
    if (entryMode === 'manual') {
      const manualMaturityNum = Number(formData.maturityAmount);
      if (
        !formData.maturityAmount ||
        isNaN(manualMaturityNum) ||
        !(manualMaturityNum > 0)
      ) {
        toast({
          title: 'Validation Error',
          description: 'Manual mode requires a Maturity Amount greater than 0.',
          variant: 'destructive',
        });
        return;
      }
      maturityForSend = manualMaturityNum;
    } else {
      const computed = calcMaturity(
        formData.issueAmount,
        formData.interestRate,
        formData.issueDate,
        formData.maturityDate,
        formData
      );
      if (computed === null) {
        toast({
          title: 'Validation Error',
          description:
            'Could not compute the maturity amount. Check the Issue Amount, Interest Rate and Dates.',
          variant: 'destructive',
        });
        return;
      }
      maturityForSend = computed;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        place: formData.place,
        holderName: formData.holderName,
        accountNumber: formData.accountNumber,
        interestRate: rateNum,
        issueDate: formData.issueDate,
        maturityDate: formData.maturityDate,
        investmentPeriod:
          formData.investmentPeriod ||
          calculateTenurePeriod(formData.issueDate, formData.maturityDate),
        issueAmount: issueAmountNum,
        maturityAmount: maturityForSend,
        maturityMode: entryMode === 'manual' ? 'MANUAL' : 'AUTOMATIC',
        nominee: formData.nominee,
        remarks: formData.remarks,
        // [DEPRECATED-SEC-04-05] Interest Structure / Eligibility fields are DISABLED (sections
        // 04/05) and deliberately NOT sent: the backend means compute maturity with its fixed
        // defaults (CUMULATIVE / QUARTERLY / AT_MATURITY) while preserving any stored fdType on
        // edit. Re-enable together with the sections to start sending them again. [DEPRECATED-TDS]
        // hasPan / form15g15hSubmitted were removed from the backend DTO and are not sent either.
        // fdType: formData.fdType || 'CUMULATIVE',
        // compoundingFrequency: formData.compoundingFrequency || 'QUARTERLY',
        // payoutFrequency: formData.payoutFrequency || 'AT_MATURITY',
        // isSeniorCitizen: !!formData.isSeniorCitizen,
        // isTaxSaver: !!formData.isTaxSaver,
      });
      onClose();
    } catch (error) {
      console.error('Error saving FD:', error);
      toast({
        title: 'Failed to Save',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'An unexpected error occurred while saving the fixed deposit.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='ed-card w-full max-w-2xl relative flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-200'>
        <span className='corner-mark corner-tl' />
        <span className='corner-mark corner-tr' />
        <span className='corner-mark corner-bl' />
        <span className='corner-mark corner-br' />

        <div className='flex items-center justify-between p-6 border-b border-border'>
          <div>
            <h2 className='font-serif text-[24px] text-foreground leading-none mb-1'>
              {initialData ? 'Edit Fixed Deposit' : 'New Fixed Deposit'}
            </h2>
            <p className='text-[12px] text-muted-foreground font-mono uppercase tracking-[0.05em]'>
              {initialData
                ? `FD #${initialData.fdNo}`
                : 'Enter deposit details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='p-6 overflow-y-auto space-y-6'>
          <form id='fd-form' onSubmit={handleSubmit} className='space-y-6'>
            {/* Section 1: Institution & Holder Info */}
            <div className='space-y-3'>
              <h3 className='text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1'>
                01. General Info
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-1.5 md:col-span-1'>
                  <label className='eyebrow'>Bank/Institution *</label>
                  <BankSearchCombobox
                    value={formData.place}
                    onChange={val => setFormData({ ...formData, place: val })}
                  />
                </div>
                <div className='space-y-1.5 md:col-span-1'>
                  <label className='eyebrow'>Holder Name *</label>
                  <input
                    type='text'
                    required
                    value={formData.holderName}
                    onChange={e =>
                      setFormData({ ...formData, holderName: e.target.value })
                    }
                    className='ed-input w-full'
                    placeholder='Primary account holder'
                  />
                </div>
                <div className='space-y-1.5 md:col-span-1'>
                  <label className='eyebrow'>Account / FD No.</label>
                  <input
                    type='text'
                    value={formData.accountNumber}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                    className='ed-input w-full font-mono'
                    placeholder='Optional A/C No.'
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Dates & Auto Tenure Period */}
            <div className='space-y-3'>
              <h3 className='text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1 flex items-center justify-between'>
                <span>02. Tenure & Dates</span>
                {formData.investmentPeriod && (
                  <span className='text-[hsl(var(--accent))] flex items-center gap-1 font-normal lowercase tracking-normal'>
                    <Calendar className='h-3 w-3' /> {formData.investmentPeriod}
                  </span>
                )}
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <label className='eyebrow'>Issue Date *</label>
                  <input
                    type='date'
                    required
                    value={formData.issueDate}
                    onChange={e =>
                      handleDateChange('issueDate', e.target.value)
                    }
                    className='ed-input w-full font-mono'
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='eyebrow'>Maturity Date *</label>
                  <input
                    type='date'
                    required
                    value={formData.maturityDate}
                    onChange={e =>
                      handleDateChange('maturityDate', e.target.value)
                    }
                    className='ed-input w-full font-mono'
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Financials (Initial Amount & Interest Rate, with Maturity Amount at the END) */}
            <div className='space-y-3'>
              <h3 className='text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1'>
                03. Investment & Interest Details
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between h-5'>
                    <label className='eyebrow'>
                      Initial / Issue Amount (₹) *
                    </label>
                  </div>
                  <input
                    type='text'
                    required
                    value={formData.issueAmount}
                    onChange={handleIssueAmountChange}
                    className='ed-input w-full font-mono'
                    placeholder='e.g. 5L or 500000'
                  />
                  {formData.issueAmount &&
                    !isNaN(formData.issueAmount) &&
                    Number(formData.issueAmount) > 0 && (
                      <p className='text-[11px] font-mono text-[hsl(var(--accent))] mt-1'>
                        {formatIndianCurrency(formData.issueAmount)}
                        {formatInIndianWords(formData.issueAmount)
                          ? ` (${formatInIndianWords(formData.issueAmount)})`
                          : ''}
                      </p>
                    )}
                </div>

                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between h-5'>
                    <label className='eyebrow'>Interest Rate (%) *</label>
                    <button
                      type='button'
                      onClick={() => triggerRateCalculation()}
                      className='text-[10px] font-mono text-[hsl(var(--accent))] hover:underline flex items-center gap-1'
                      title='Auto-calculate Interest Rate from Maturity & Initial Amount'
                    >
                      <RefreshCw className='h-2.5 w-2.5' /> Calc Rate
                    </button>
                  </div>
                  <input
                    type='number'
                    step='0.01'
                    required
                    value={formData.interestRate}
                    onChange={handleInterestRateChange}
                    className='ed-input w-full font-mono'
                    placeholder='e.g. 7.1'
                  />
                </div>
              </div>

              {/* Maturity Amount placed at the LAST of Financial Section */}
              <div className='space-y-1.5 pt-2 border-t border-dashed border-border/60 mt-3'>
                <div className='flex items-center justify-between'>
                  <label className='eyebrow flex items-center gap-1.5 text-foreground font-semibold'>
                    <Sparkles className='h-3 w-3 text-[hsl(var(--gain))]' />
                    Maturity Amount (₹)
                  </label>
                </div>
                <div className='flex items-center space-x-2 mt-2 mb-2'>
                  <button
                    type='button'
                    onClick={() => handleModeChange('automatic')}
                    className={`px-3 py-1 text-[11px] font-mono uppercase tracking-[0.05em] rounded-full transition-colors ${
                      entryMode === 'automatic'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Automatic Mode
                  </button>
                  <button
                    type='button'
                    onClick={() => handleModeChange('manual')}
                    className={`px-3 py-1 text-[11px] font-mono uppercase tracking-[0.05em] rounded-full transition-colors ${
                      entryMode === 'manual'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Manual Mode
                  </button>
                </div>

                {entryMode === 'manual' && (
                  <div className='animate-in slide-in-from-top-1 fade-in duration-200'>
                    <input
                      type='text'
                      value={formData.maturityAmount}
                      onChange={handleMaturityAmountChange}
                      className='ed-input w-full font-mono text-[16px] font-semibold text-[hsl(var(--gain))] bg-[hsl(var(--gain))]/5 border-[hsl(var(--gain))]/30 focus:border-[hsl(var(--gain))]'
                      placeholder='Enter maturity amount manually'
                    />
                    <p className='text-[11px] text-muted-foreground mt-1.5 leading-tight'>
                      Manual mode keeps the certificate value as-is — the server
                      will NOT recalculate it on save. Change the Maturity
                      Amount above to update it.
                    </p>
                  </div>
                )}
                {entryMode === 'automatic' && (
                  <div className='animate-in slide-in-from-top-1 fade-in duration-200'>
                    <input
                      type='text'
                      value={formData.maturityAmount}
                      readOnly
                      className='ed-input w-full font-mono text-[16px] font-semibold text-[hsl(var(--gain))] bg-[hsl(var(--gain))]/5 border-none opacity-80 cursor-not-allowed'
                      placeholder='0.00 (Auto-calculated)'
                    />
                    <p className='text-[11px] text-muted-foreground mt-1.5 leading-tight'>
                      Maturity amount is auto-calculated based on interest rate
                      and tenure. Switch to Manual mode to override.
                    </p>
                    {initialData?.serverComputedMaturityAmount != null &&
                      formData.maturityAmount &&
                      !isNaN(formData.maturityAmount) &&
                      Math.abs(
                        Number(formData.maturityAmount) -
                          Number(initialData.serverComputedMaturityAmount)
                      ) > 1 && (
                        <p className='text-[11px] font-mono text-[hsl(var(--loss))] mt-1.5 leading-tight'>
                          This estimate deviates from the server (bank-formula)
                          value by more than ₹1 — the server will apply its own
                          computation on save.
                        </p>
                      )}
                  </div>
                )}
                {formData.maturityAmount &&
                  !isNaN(formData.maturityAmount) &&
                  Number(formData.maturityAmount) > 0 && (
                    <div className='flex flex-col gap-1.5 mt-1'>
                      <div className='flex items-center justify-between text-[11px] font-mono text-[hsl(var(--gain))]'>
                        <span>
                          {formatIndianCurrency(formData.maturityAmount)}{' '}
                          {formatInIndianWords(formData.maturityAmount)
                            ? `(${formatInIndianWords(formData.maturityAmount)})`
                            : ''}
                        </span>
                        {formData.issueAmount &&
                          Number(formData.maturityAmount) >
                            Number(formData.issueAmount) && (
                            <span className='text-muted-foreground'>
                              Est. Interest: +
                              {formatIndianCurrency(
                                Number(formData.maturityAmount) -
                                  Number(formData.issueAmount)
                              )}
                            </span>
                          )}
                      </div>
                    </div>
                  )}
                <p className='text-[9.5px] text-muted-foreground/80 italic leading-tight font-serif mt-2'>
                  * Note: Calculated maturity amount is an estimate based on
                  standard banking formulas. The exact final amount may differ
                  slightly depending on the specific bank's internal calculation
                  precision.
                </p>
                {initialData &&
                  initialData.serverComputedMaturityAmount != null &&
                  Number(initialData.serverComputedMaturityAmount) > 0 && (
                    <div className='mt-2 border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 rounded-sm px-3 py-2'>
                      <div className='flex items-center justify-between text-[11px] font-mono'>
                        <span className='text-muted-foreground'>
                          Server (bank-formula) maturity:
                        </span>
                        <span className='text-foreground font-semibold'>
                          {formatIndianCurrency(
                            initialData.serverComputedMaturityAmount
                          )}
                        </span>
                      </div>
                      {initialData.maturityDifference != null &&
                        Math.abs(Number(initialData.maturityDifference)) >
                          0.009 && (
                          <div className='flex items-center justify-between text-[11px] font-mono mt-0.5'>
                            <span className='text-muted-foreground'>
                              {initialData.maturityAmountOverridden
                                ? 'Server override vs client estimate:'
                                : 'Saved vs server compute:'}
                            </span>
                            <span
                              className={
                                Number(initialData.maturityDifference) > 0
                                  ? 'text-[hsl(var(--gain))]'
                                  : 'text-[hsl(var(--loss))]'
                              }
                            >
                              {formatIndianCurrency(
                                initialData.maturityDifference
                              )}
                            </span>
                          </div>
                        )}
                      <p className='text-[10px] text-muted-foreground/80 mt-1 leading-tight'>
                        Saved maturity{' '}
                        {initialData.maturityAmountOverridden
                          ? 'is the server-computed value (saved in auto mode)'
                          : 'matches the server computation within tolerance'}
                        .
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* ============================================================
                 SECTION 04 — INTEREST STRUCTURE  (INTENTIONALLY COMMENTED OUT)
                 ------------------------------------------------------------------
                 FD Type (Cumulative / Non-Cumulative), Compounding Frequency and
                 Interest Payout are temporarily disabled (hidden from the UI and
                 not sent to the backend). The backend continues to compute
                 maturity using its fixed defaults (CUMULATIVE / QUARTERLY /
                 AT_MATURITY). To re-enable later, uncomment this block and the
                 related constants / submit fields below.
                 ============================================================ */}
            {/*
            <div className='space-y-3'>
              <h3 className='text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1'>
                04. Interest Structure
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-1.5'>
                  <label className='eyebrow'>FD Type</label>
                  <select
                    value={formData.fdType}
                    onChange={e =>
                      setFormData({ ...formData, fdType: e.target.value })
                    }
                    className='ed-input w-full font-mono'
                  >
                    {FD_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1.5'>
                  <label className='eyebrow'>Compounding Frequency</label>
                  <select
                    value={formData.compoundingFrequency}
                    disabled={formData.fdType === 'NON_CUMULATIVE'}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        compoundingFrequency: e.target.value,
                      })
                    }
                    className='ed-input w-full font-mono disabled:opacity-50'
                  >
                    {COMPOUNDING_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1.5'>
                  <label className='eyebrow'>Interest Payout</label>
                  <select
                    value={formData.payoutFrequency}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        payoutFrequency: e.target.value,
                      })
                    }
                    className='ed-input w-full font-mono'
                  >
                    {PAYOUT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.fdType === 'NON_CUMULATIVE' && (
                <p className='text-[11px] text-muted-foreground leading-tight'>
                  Non-cumulative FDs pay interest out periodically (simple
                  interest); the maturity amount equals the principal. The
                  payout schedule above indicates when the interest is credited.
                </p>
              )}
            </div>
            */}

            {/* ============================================================
                 SECTION 05 — TAX & COMPLIANCE  (INTENTIONALLY COMMENTED OUT)
                 ------------------------------------------------------------------
                 Senior Citizen (TDS threshold), Tax Saver (80C), PAN, Form
                 15G/15H and the TDS explanatory note are temporarily disabled
                 (hidden from the UI and not sent to the backend). TDS summary
                 is also removed from the FD list page. To re-enable later,
                 uncomment this block and the related submit fields below.
                 ============================================================ */}
            {/*
            <div className='space-y-3'>
              <h3 className='text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1'>
                05. Tax & Compliance
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label className='eyebrow'>Details</label>
                  <label className='flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground'>
                    <input
                      type='checkbox'
                      checked={!!formData.isSeniorCitizen}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isSeniorCitizen: e.target.checked,
                        })
                      }
                      className='h-4 w-4 accent-[hsl(var(--accent))]'
                    />
                    Senior Citizen (higher TDS threshold ₹1L)
                  </label>
                  <label className='flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground'>
                    <input
                      type='checkbox'
                      checked={!!formData.isTaxSaver}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isTaxSaver: e.target.checked,
                        })
                      }
                      className='h-4 w-4 accent-[hsl(var(--accent))]'
                    />
                    Tax Saver FD (Section 80C)
                  </label>
                  <label className='flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground'>
                    <input
                      type='checkbox'
                      checked={!!formData.hasPan}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          hasPan: e.target.checked,
                        })
                      }
                      className='h-4 w-4 accent-[hsl(var(--accent))]'
                    />
                    PAN available (lower 10% TDS)
                  </label>
                  <label className='flex items-center gap-2.5 cursor-pointer text-[13px] text-foreground'>
                    <input
                      type='checkbox'
                      checked={!!formData.form15g15hSubmitted}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          form15g15hSubmitted: e.target.checked,
                        })
                      }
                      className='h-4 w-4 accent-[hsl(var(--accent))]'
                    />
                    Form 15G / 15H submitted (TDS exempt)
                  </label>
                </div>
                <div className='space-y-1.5'>
                  <div className='h-5' />
                  <p className='text-[11px] text-muted-foreground leading-relaxed'>
                    TDS is computed at the <strong>bank level</strong>: the ₹50k
                    (regular) / ₹1L (senior citizen) threshold applies to the
                    combined interest across all deposits at the same bank. The
                    backend automatically derives this and shows it in the TDS
                    summary.
                  </p>
                  {formData.isSeniorCitizen && (
                    <p className='text-[11px] text-muted-foreground leading-relaxed'>
                      Senior-citizen FD rates already embed any bonus; this flag
                      only raises the TDS exemption threshold.
                    </p>
                  )}
                </div>
              </div>
            </div>
            */}

            {/* Section 6: Nominee & Remarks */}
            <div className='space-y-3'>
              <h3 className='text-[11px] font-mono uppercase text-muted-foreground tracking-[0.1em] border-b border-border/50 pb-1'>
                06. Additional Details
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <label className='eyebrow'>Nominee Name</label>
                  <input
                    type='text'
                    value={formData.nominee}
                    onChange={e =>
                      setFormData({ ...formData, nominee: e.target.value })
                    }
                    className='ed-input w-full'
                    placeholder='Nominee name (Optional)'
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='eyebrow'>Remarks / Notes</label>
                  <input
                    type='text'
                    value={formData.remarks}
                    onChange={e =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    className='ed-input w-full'
                    placeholder='Additional notes or references (Optional)'
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className='p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto'>
          {initialData && onDelete ? (
            <button
              type='button'
              onClick={onDelete}
              disabled={isSubmitting}
              className='text-[11px] font-mono text-[hsl(var(--loss))] hover:underline disabled:opacity-50'
            >
              [ DELETE FD ]
            </button>
          ) : (
            <div />
          )}
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className='ed-btn bg-card border-border hover:bg-muted text-foreground'
            >
              Cancel
            </button>
            <button
              type='submit'
              form='fd-form'
              disabled={isSubmitting}
              className='ed-btn ed-btn-accent min-w-[100px]'
            >
              {isSubmitting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Save Deposit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

