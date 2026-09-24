'use client';

import { FormField } from './FormField';
import { normalizePhoneIndia } from '@/lib/validation/identity';

/**
 * Indian Phone Number Input - Auto-formats as "XXXXX XXXXX" with "+91" prefix.
 * Emits canonical 10-digit number.
 */
export function PhoneInput({
  value,
  onChange,
  label = 'Mobile Number',
  placeholder = '98765 43210',
  error,
  ...props
}) {
  const rawDigits = normalizePhoneIndia(value || '');

  const handleChange = e => {
    const digits = normalizePhoneIndia(e.target.value);
    if (digits.length <= 10 && onChange) {
      onChange(digits);
    }
  };

  const displayFormatted =
    rawDigits.length > 5
      ? `${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`
      : rawDigits;

  return (
    <FormField
      label={label}
      prefix='+91'
      type='tel'
      inputMode='numeric'
      value={displayFormatted}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={11} // 10 digits + 1 space
      error={error}
      {...props}
    />
  );
}

export default PhoneInput;
