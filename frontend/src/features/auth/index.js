export { default as LoginScreen } from '@/components/ui/auth/login-screen';
export { default as SecurityInputs } from '@/components/ui/auth/security-inputs';
export {
  normalizeEmail,
  normalizeName,
  normalizePhoneIndia,
  normalizeUsername,
  validateEmail,
  validateName,
  validatePhoneIndia,
  validateUsername,
} from '@/lib/validation/identity';
export { authService } from '@/services/auth.service';
