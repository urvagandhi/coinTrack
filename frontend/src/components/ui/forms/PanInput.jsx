'use client';

import { normalizePAN } from '@/lib/validation/financial';
import { FormField } from './FormField';

/**
 * PAN Card Input - Enforces uppercase, 10 characters, and entity validation check.
 */
export function PanInput({
  value,
  onChange,
  label = 'PAN Card Number',
  placeholder = 'ABCDE1234F',
  error,
  ...props
}) {
  const handleChange = e => {
    const cleaned = normalizePAN(e.target.value);
    if (cleaned.length <= 10 && onChange) {
      onChange(cleaned);
    }
  };

  return (
    <FormField
      label={label}
      type='text'
      autoCapitalize='characters'
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      error={error}
      {...props}
    />
  );
}

export default PanInput;
