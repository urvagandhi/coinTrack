import {
  AlertTriangle,
  Bell,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export const SETTINGS_TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'security', label: 'Security Options', icon: ShieldCheck },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

export const NOTIF_LABELS = {
  priceAlerts: {
    title: 'Price Alerts',
    body: 'Notify when watched symbols and mutual funds reach your targets.',
  },
  portfolioUpdates: {
    title: 'Portfolio Updates',
    body: 'Daily summary digest of net worth movement and asset changes.',
  },
  marketNews: {
    title: 'Market News',
    body: 'Curated financial headlines and corporate earnings for your holdings.',
  },
  weeklyReports: {
    title: 'Weekly Reports',
    body: 'Comprehensive performance digest delivered every Sunday morning.',
  },
};

export const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Laptop },
];

export const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
];
