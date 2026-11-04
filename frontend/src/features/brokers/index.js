// frontend/src/features/brokers/index.js — Clean barrel export for Broker subsystem

// ── Views & Primary Components ──
export {
  BrokersView,
  default as BrokersViewDefault,
} from './components/BrokersView';
export { BrokersHeader } from './components/BrokersHeader';
export { BrokersKpiGrid } from './components/BrokersKpiGrid';
export { BrokersFilterToolbar } from './components/BrokersFilterToolbar';
export { BrokersSecurityNotice } from './components/BrokersSecurityNotice';

// ── Common Shared Broker Components ──
export {
  BrokerCard,
  default as BrokerCardDefault,
} from './components/BrokerCard';
export {
  BrokerSidebar,
  default as BrokerSidebarDefault,
} from './components/BrokerSidebar';
export {
  BrokerSetupLayout,
  default as BrokerSetupLayoutDefault,
} from './components/BrokerSetupLayout';
export {
  BrokerGuideTab,
  default as BrokerGuideTabDefault,
} from './components/BrokerGuideTab';
export {
  ConnectionHubPanel,
  default as ConnectionHubPanelDefault,
} from './components/ConnectionHubPanel';
export {
  CredentialField,
  default as CredentialFieldDefault,
} from './components/CredentialField';
export {
  BrokerCallbackHandler,
  default as BrokerCallbackHandlerDefault,
} from './components/BrokerCallbackHandler';

// ── Specific Broker Views ──
export {
  ZerodhaSetupView,
  default as ZerodhaSetupViewDefault,
} from './components/ZerodhaSetupView';
export {
  ZerodhaCallbackView,
  default as ZerodhaCallbackViewDefault,
} from './components/ZerodhaCallbackView';

export {
  UpstoxSetupView,
  default as UpstoxSetupViewDefault,
} from './components/UpstoxSetupView';
export {
  UpstoxCallbackView,
  default as UpstoxCallbackViewDefault,
} from './components/UpstoxCallbackView';

export {
  AngelOneSetupView,
  default as AngelOneSetupViewDefault,
} from './components/AngelOneSetupView';

// ── Hooks & Constants ──
export * from './hooks/useBrokerConnection';
export * from './hooks/useSyncFeeds';
export * from './constants';
