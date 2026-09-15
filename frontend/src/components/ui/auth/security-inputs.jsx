'use client';

import {
  useId,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

// ───────────────────────────────────────────────────────────────
//  PLATFORM COMPATIBILITY MATRIX & LIMITATIONS
// ───────────────────────────────────────────────────────────────
/**
 * BANK-GRADE HARDWARE MODIFIER DETECTION ARCHITECTURE
 *
 * Supported OS: Windows, Linux (X11 & Wayland), macOS, Android (hardware keyboard), iOS (hardware keyboard).
 * Supported Browsers: Chrome/Chromium, Firefox, Safari, Edge.
 *
 * KNOWN PLATFORM LIMITATIONS & DEGRADATION RULES:
 * 1. Initial State ("The Cold-Start Limitation"):
 *    The W3C DOM Level 3 Events specification provides NO synchronous browser API
 *    to query hardware lock states prior to user interaction.
 *    -> Solution: Both CapsLock and NumLock initialize as 'unknown' (tri-state: true | false | 'unknown').
 *    -> UX Rule: Indicators remain completely silent when 'unknown' or false. Never assume false.
 *
 * 2. Android / iOS Virtual/Soft Keyboards:
 *    Mobile virtual keyboards (IMEs like Gboard, iOS keyboard) do not have a physical
 *    Caps Lock key and emit synthetic or composition events (keyCode 229 / 'Unidentified').
 *    They either omit getModifierState entirely, throw, or produce erratic toggles.
 *    -> Solution: On touch-primary devices (`(pointer: coarse)` / `maxTouchPoints > 0`),
 *       unreliable soft-keyboard composition events are suppressed, keeping state 'unknown'
 *       unless a clean, definitive hardware event from an external keyboard is received.
 *
 * 3. macOS & Keyboards without Physical Numpad:
 *    macOS dropped NumLock support decades ago. Most laptops omit numeric keypads.
 *    -> Solution: NumLock stays silent/gracefully degraded when unexposed or false.
 *
 * 4. Embedded WebViews & In-App Browsers:
 *    Certain custom WebViews have `getModifierState` on the prototype but throw
 *    an internal exception when invoked.
 *    -> Solution: Strict feature-detection gate + try/catch with telemetry logging.
 */

// ───────────────────────────────────────────────────────────────
//  REUSABLE HOOK: useKeyboardModifierState
// ───────────────────────────────────────────────────────────────

/**
 * Tri-state modifier value:
 * - 'unknown': No reliable keyboard event has fired yet, or platform does not support the API.
 * - true: Modifier is definitively locked ON by the OS/hardware.
 * - false: Modifier is definitively unlocked OFF.
 *
 * @typedef {'unknown' | boolean} TriStateModifier
 *
 * @typedef {Object} KeyboardModifierHookOptions
 * @property {(modifier: 'CapsLock' | 'NumLock', error: unknown) => void} [onError] - Telemetry error hook
 * @property {boolean} [suppressTouch=true] - Whether to suppress soft-keyboard composition events on mobile
 *
 * @typedef {Object} KeyboardModifierState
 * @property {TriStateModifier} capsLock - Current CapsLock state
 * @property {TriStateModifier} numLock - Current NumLock state
 * @property {boolean} isSupported - Whether KeyboardEvent.getModifierState is supported without throwing
 * @property {() => void} resetCapsLock - Dismiss or reset CapsLock warning
 * @property {() => void} resetNumLock - Dismiss or reset NumLock warning
 */

/**
 * Custom hook to track hardware CapsLock and NumLock in real time across the window.
 * Attaches purely at window level (never on specific input DOM elements) with capture=true.
 *
 * @param {KeyboardModifierHookOptions} [options]
 * @returns {KeyboardModifierState}
 */
export function useKeyboardModifierState(options = {}) {
  const { onError, suppressTouch = true } = options;

  const [capsLock, setCapsLock] = useState(
    /** @type {TriStateModifier} */ ('unknown')
  );
  const [numLock, setNumLock] = useState(
    /** @type {TriStateModifier} */ ('unknown')
  );
  const [isSupported, setIsSupported] = useState(true);

  // Detect touch-primary environment (mobile phones/tablets)
  const isTouchPrimary = useCallback(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined')
      return false;
    return Boolean(
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    );
  }, []);

  // Primary event processor for any KeyboardEvent / MouseEvent
  const updateModifierState = useCallback(
    event => {
      // 1. Defensive Feature Detection Gate
      if (!event || typeof event.getModifierState !== 'function') {
        setIsSupported(false);
        return;
      }

      // 2. Mobile Soft-Keyboard Rejection Gate
      // If on a touch-primary device, reject IME synthetic events that report inaccurate state
      if (suppressTouch && isTouchPrimary()) {
        if (
          event.isComposing ||
          event.keyCode === 229 ||
          event.key === 'Unidentified'
        ) {
          return;
        }
      }

      // 3. Evaluate CapsLock with try/catch telemetry guard
      try {
        const capsState = event.getModifierState('CapsLock');
        if (typeof capsState === 'boolean') {
          setCapsLock(prev => (prev !== capsState ? capsState : prev));
        }
      } catch (err) {
        if (typeof onError === 'function') {
          onError('CapsLock', err);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[useKeyboardModifierState] Failed querying CapsLock modifier state:',
            err
          );
        }
        setIsSupported(false);
      }

      // 4. Evaluate NumLock with try/catch telemetry guard
      try {
        const numState = event.getModifierState('NumLock');
        if (typeof numState === 'boolean') {
          setNumLock(prev => (prev !== numState ? numState : prev));
        }
      } catch (err) {
        if (typeof onError === 'function') {
          onError('NumLock', err);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[useKeyboardModifierState] Failed querying NumLock modifier state:',
            err
          );
        }
        setIsSupported(false);
      }
    },
    [onError, suppressTouch, isTouchPrimary]
  );

  // Window-level listener with capture=true catches modifier toggles anywhere across the document
  // Symmetrically handles both keydown and keyup so toggle-on and toggle-off are instantly captured
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyEvent = e => {
      updateModifierState(e);
    };

    const handleMouseEvent = e => {
      updateModifierState(e);
    };

    window.addEventListener('keydown', handleKeyEvent, {
      capture: true,
      passive: true,
    });
    window.addEventListener('keyup', handleKeyEvent, {
      capture: true,
      passive: true,
    });
    window.addEventListener('mousedown', handleMouseEvent, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener('keydown', handleKeyEvent, { capture: true });
      window.removeEventListener('keyup', handleKeyEvent, { capture: true });
      window.removeEventListener('mousedown', handleMouseEvent, {
        capture: true,
      });
    };
  }, [updateModifierState]);

  const resetCapsLock = useCallback(() => setCapsLock(false), []);
  const resetNumLock = useCallback(() => setNumLock(false), []);

  return useMemo(
    () => ({
      capsLock,
      numLock,
      isSupported,
      resetCapsLock,
      resetNumLock,
    }),
    [capsLock, numLock, isSupported, resetCapsLock, resetNumLock]
  );
}

// ───────────────────────────────────────────────────────────────
//  REUSABLE INDICATOR COMPONENT: ModifierWarningBadge
// ───────────────────────────────────────────────────────────────

/**
 * Reusable bank-grade warning badge that stays strictly silent when modifier
 * state is 'unknown' or false, rendering only on definitive true.
 *
 * @param {Object} props
 * @param {TriStateModifier} props.state - 'unknown' | true | false
 * @param {string} props.label - E.g. 'Caps' or 'Num'
 * @param {string} props.title - Tooltip text
 * @param {'warning' | 'default'} [props.variant='warning'] - Badge variant
 * @param {() => void} [props.onDismiss] - Callback when clicked
 * @param {string} [props.className]
 */
export function ModifierWarningBadge({
  state,
  label,
  title,
  variant = 'warning',
  onDismiss,
  className,
}) {
  // Strict bank-grade rule: only display when definitively true.
  // Never display when false or 'unknown' (avoids false alarms).
  if (state !== true) {
    return null;
  }

  return (
    <Badge
      asChild
      variant={variant}
      className={cn(
        'animate-in fade-in slide-in-from-right-2 cursor-pointer select-none transition-all shadow-xs',
        className
      )}
    >
      <button
        type='button'
        tabIndex={-1}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss?.();
        }}
        title={`${title} (Click to dismiss)`}
        aria-label={title}
      >
        {label}
      </button>
    </Badge>
  );
}

// ───────────────────────────────────────────────────────────────
//  PASSWORD STRENGTH SCORING HELPERS
// ───────────────────────────────────────────────────────────────

export function scorePassword(password) {
  if (typeof password !== 'string' || !password) return 0;
  let score = 0;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@$!%*?&#]/.test(password)) score++;
  if (password.length >= 8) score++;
  return score;
}

export function passwordStrengthInfo(password) {
  if (typeof password !== 'string' || !password) {
    return {
      score: 0,
      text: 'Enter a password',
      color: 'text-muted-foreground',
    };
  }
  const score = scorePassword(password);
  if (score <= 2) return { score, text: 'Weak', color: 'text-red-500' };
  if (score === 3) return { score, text: 'Fair', color: 'text-amber-500' };
  if (score === 4) return { score, text: 'Good', color: 'text-blue-500' };
  return { score, text: 'Very Strong', color: 'text-emerald-500' };
}

const SEGMENT_COLORS = {
  1: 'bg-red-500',
  2: 'bg-red-500',
  3: 'bg-amber-500',
  4: 'bg-blue-500',
  5: 'bg-emerald-500',
};

const DEFAULT_RULES = [
  { test: p => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: p => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: p => /[0-9]/.test(p), label: 'One number' },
  { test: p => /[@$!%*?&#]/.test(p), label: 'One special char (@$!%*?&#)' },
  { test: p => typeof p === 'string' && p.length >= 8, label: '8+ characters' },
];

// ───────────────────────────────────────────────────────────────
//  PASSWORD STRENGTH INPUT (Bank-Grade with Modifier Detection)
// ───────────────────────────────────────────────────────────────

export function PasswordStrengthInput({
  label = 'Master Encryption Password',
  labelClassName,
  value = '',
  onChange,
  placeholder = 'Enter master password...',
  showRules = true,
  showStrengthBar = true,
  rules = DEFAULT_RULES,
  className,
  inputClassName,
  containerClassName,
  showLockIcon = true,
  leftIcon: LeftIcon = Lock,
  showCapsBadge = true,
  showNumBadge = true,
  showEyeToggle = true,
  autoComplete = 'current-password',
  id,
  name,
  disabled = false,
  required = false,
  onModifierError,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  // Consume production bank-grade modifier tracking hook (attached purely to window)
  const { capsLock, numLock, resetCapsLock, resetNumLock } =
    useKeyboardModifierState({ onError: onModifierError });

  const safeValue = typeof value === 'string' ? value : '';
  const { score, text, color } = useMemo(
    () => passwordStrengthInfo(safeValue),
    [safeValue]
  );

  return (
    <div className={cn('w-full min-w-0 space-y-2', className)}>
      {label && (
        <div className='flex flex-wrap items-center justify-between gap-1 min-w-0'>
          <label
            htmlFor={inputId}
            className={cn(
              'text-[13px] font-semibold text-foreground shrink-0 cursor-pointer',
              labelClassName
            )}
          >
            {label}
          </label>
          {showRules && (
            <span
              className={cn('text-xs font-medium shrink-0', color)}
              aria-live='polite'
            >
              {text}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative flex items-center w-full min-w-0 rounded-xl bg-card/60 hover:bg-card/90 focus-within:bg-background backdrop-blur-xl border border-border/50 focus-within:border-foreground/30 shadow-xs transition-all duration-200',
          disabled && 'opacity-60 pointer-events-none',
          containerClassName
        )}
      >
        {showLockIcon && LeftIcon && (
          <div
            className='pl-3.5 pr-1 text-muted-foreground shrink-0 select-none'
            aria-hidden='true'
          >
            <LeftIcon className='size-4' />
          </div>
        )}

        {/* The DOM input has NO keydown/keyup modifier listeners attached directly;
            all modifier detection is handled globally at the window level */}
        <Input
          ref={inputRef}
          id={inputId}
          name={name}
          autoComplete={autoComplete}
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck={false}
          type={showPassword ? 'text' : 'password'}
          value={safeValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            'flex-1 min-w-0 !bg-transparent !border-0 !shadow-none !ring-0 focus-visible:!ring-0 !outline-none py-2.5 text-xs sm:text-[14px] text-foreground placeholder:text-muted-foreground/40 pl-3.5',
            showLockIcon && 'pl-1',
            inputClassName
          )}
          {...rest}
        />

        {/* Bank-grade modifier key warnings: only visible when state is strictly true */}
        <div
          className='flex items-center gap-1.5 shrink-0 mr-1 overflow-hidden'
          aria-live='polite'
        >
          {showCapsBadge && (
            <ModifierWarningBadge
              state={capsLock}
              label='Caps'
              title='Caps Lock is ON'
              variant='warning'
              onDismiss={resetCapsLock}
            />
          )}

          {showNumBadge && (
            <ModifierWarningBadge
              state={numLock}
              label='Num'
              title='Num Lock is ON'
              variant='default'
              onDismiss={resetNumLock}
            />
          )}
        </div>

        {showEyeToggle && (
          <button
            type='button'
            onClick={() => setShowPassword(v => !v)}
            className='p-2.5 pr-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg'
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className='size-4' aria-hidden='true' />
            ) : (
              <Eye className='size-4' aria-hidden='true' />
            )}
          </button>
        )}
      </div>

      {showRules && (
        <div
          className='space-y-1.5 w-full min-w-0'
          aria-label='Password requirements'
        >
          {showStrengthBar && (
            <div
              className='grid grid-cols-5 gap-1.5 h-1.5 w-full'
              aria-hidden='true'
            >
              {[1, 2, 3, 4, 5].map(seg => (
                <div
                  key={seg}
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    score >= seg ? SEGMENT_COLORS[score] : 'bg-muted/40'
                  )}
                />
              ))}
            </div>
          )}
          <div className='pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
            {rules.map(rule => {
              const done = rule.test(safeValue);
              return (
                <div
                  key={rule.label}
                  className={cn(
                    'text-[11px] sm:text-[12px] flex items-center gap-2 transition-all duration-300 truncate',
                    done
                      ? 'text-muted-foreground/40 line-through scale-95 origin-left'
                      : 'text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full shrink-0 transition-all duration-300',
                      done ? 'bg-emerald-500/50' : 'bg-current'
                    )}
                    aria-hidden='true'
                  />
                  <span className='truncate'>{rule.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
//  SMART AUTH INPUT (Email/Phone/Username)
// ───────────────────────────────────────────────────────────────

export function SmartAuthInput({
  label = 'Email, Phone or Username',
  labelClassName,
  value = '',
  onChange,
  placeholder = 'Enter your details...',
  className,
  inputClassName,
  containerClassName,
  id,
  name,
  autoComplete = 'username',
  disabled = false,
  required = false,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const rawValue = typeof value === 'string' ? value : '';

  // Derived input types memoized to minimize recalculations
  const { isPhone, isEmail, isUsername } = useMemo(() => {
    const trimmed = rawValue.trim();
    const phone = trimmed.length > 0 && /^[0-9+\s()-]+$/.test(trimmed);
    const email = trimmed.includes('@');
    const username = trimmed.length > 0 && /^[a-zA-Z0-9_]+$/.test(trimmed);
    return { isPhone: phone, isEmail: email, isUsername: username };
  }, [rawValue]);

  // Secure client-side input sanitizer enforcing boundaries
  const handleChange = useCallback(
    e => {
      const val = e.target.value;
      if (typeof val !== 'string') return;

      // 1. Phone number restrictions (Digits only max 10 for standard Indian/common numbers)
      if (val.length > 0 && /^[0-9+\s()-]+$/.test(val)) {
        const digitsOnly = val.replace(/\D/g, '');
        if (digitsOnly.length > 10) {
          return;
        }
        onChange?.(e);
        return;
      }

      // 2. Prevent disallowed control/injection characters
      // Allowed: alphanumeric, @, ., _, -, +
      if (/[^a-zA-Z0-9@._+\-]/.test(val)) {
        return;
      }

      // 3. Username restriction (Max 50 alphanumeric + underscore)
      if (/^[a-zA-Z0-9_]+$/.test(val)) {
        if (val.length > 50) return;
      }
      // 4. Email restriction (Max 100)
      else {
        if (val.length > 100) return;
      }

      onChange?.(e);
    },
    [onChange]
  );

  return (
    <div className={cn('w-full min-w-0 space-y-2', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-[13px] font-semibold text-foreground ml-1 cursor-pointer',
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex items-center w-full min-w-0 rounded-xl bg-card/60 hover:bg-card/90 focus-within:bg-background backdrop-blur-xl border border-border/50 focus-within:border-foreground/30 shadow-xs transition-all duration-200',
          disabled && 'opacity-60 pointer-events-none',
          containerClassName
        )}
      >
        <div
          className='pl-3.5 pr-1 text-muted-foreground flex items-center justify-center min-w-[36px] transition-all select-none'
          aria-hidden='true'
        >
          {isPhone ? (
            <div className='flex items-center gap-1.5 pr-1 animate-in fade-in zoom-in-95 h-full'>
              <span
                className='text-sm leading-none'
                role='img'
                aria-label='India flag'
              >
                <img
                  src='https://flagcdn.com/in.svg'
                  width='16'
                  alt='India'
                  className='w-4 h-3 rounded-[2px] shadow-sm flex-shrink-0'
                />
              </span>
              <span className='text-[13px] font-medium text-foreground tracking-wide'>
                +91
              </span>
              <div className='h-4 w-px bg-border/80 ml-1' />
            </div>
          ) : isEmail ? (
            <Mail className='size-4 animate-in fade-in zoom-in-95 text-blue-500/80' />
          ) : isUsername ? (
            <User className='size-4 animate-in fade-in zoom-in-95 text-emerald-500/80' />
          ) : (
            <User className='size-4 opacity-40 transition-opacity' />
          )}
        </div>
        <Input
          id={inputId}
          name={name}
          type='text'
          autoComplete={autoComplete}
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck={false}
          value={rawValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            'flex-1 min-w-0 !bg-transparent !border-0 !shadow-none !ring-0 focus-visible:!ring-0 !outline-none py-2.5 text-xs sm:text-[14px] text-foreground placeholder:text-muted-foreground/40 pl-1',
            inputClassName
          )}
          {...rest}
        />
      </div>
    </div>
  );
}
