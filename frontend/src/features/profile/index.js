export {
  ProfileView,
  default as ProfileViewDefault,
} from './components/ProfileView';
export { ProfileSidebar } from './components/ProfileSidebar';
export { MyProfileTab } from './components/MyProfileTab';
export { SecurityOptionsTab } from './components/SecurityOptionsTab';
export { PreferencesTab } from './components/PreferencesTab';
export { NotificationsTab } from './components/NotificationsTab';
export { DangerZoneTab } from './components/DangerZoneTab';
export * from './constants';
export {
  formatPhoneDisplay,
  normalizeEmail,
  normalizeName,
  normalizePhoneIndia,
  sanitizeText,
} from '@/shared/validation/identity';
