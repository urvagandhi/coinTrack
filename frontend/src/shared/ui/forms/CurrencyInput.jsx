'use client';

import {
  formatCurrency,
  formatInIndianWords,
  parseAmount,
} from '@/shared/formatters/currency';
import { useEffect, useState } from 'react';
import { FormField } from './FormField';

/**
 * Smart Currency Input - Auto-parses Indian shortcuts (1.5L, 2Cr, 50k),
 * displays real-time Indian words hint, and outputs normalized number.
 */
export function CurrencyInput({
  value,
  onChange,
  onBlur,
  label,
  error,
  placeholder = 'e.g. 1.5L or 1,50,000',
  showIndianWords = true,
  ...props
}) {
  const [displayValue, setDisplayValue] = useState(
    value !== undefined && value !== null ? String(value) : ''
  );

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(prev => {
        if (parseAmount(prev) !== value) {
          return value ? String(value) : '';
        }
        return prev;
      });
    }
  }, [value]);

  const parsed = parseAmount(displayValue);
  const isValidAmount = !isNaN(parsed) && parsed > 0;

  const handleChange = e => {
    const raw = e.target.value;
    setDisplayValue(raw);
    const num = parseAmount(raw);
    if (onChange && !isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = e => {
    if (isValidAmount) {
      setDisplayValue(formatCurrency(parsed, { showSymbol: false }));
      if (onChange) {
        onChange(parsed);
      }
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <FormField
      label={label}
      prefix='₹'
      type='text'
      inputMode='decimal'
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      error={error}
      hint={
        showIndianWords && isValidAmount
          ? formatInIndianWords(parsed)
          : undefined
      }
      placeholder={placeholder}
      {...props}
    />
  );
}

export default CurrencyInput;

