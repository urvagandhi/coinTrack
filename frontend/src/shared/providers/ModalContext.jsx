'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const ModalContext = createContext({
  activeModal: null,
  openModal: () => {},
  closeModal: () => {},
});

export const useModal = () => useContext(ModalContext);

const LEGAL_MODALS = ['privacy', 'terms', 'security', 'cookies'];

export function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const pathname = usePathname();

  // 1. Sync modal to hash on initial load & hash changes
  useEffect(() => {
    const syncHashToModal = () => {
      const hash = window.location.hash.replace('#', '');
      if (LEGAL_MODALS.includes(hash)) {
        setActiveModal(hash);
      } else {
        setActiveModal(null);
      }
    };

    // Check on mount
    syncHashToModal();

    // Listen for hash changes (e.g. browser back/forward or manual clicks)
    window.addEventListener('hashchange', syncHashToModal);
    return () => window.removeEventListener('hashchange', syncHashToModal);
  }, []);

  // 2. Close modal if Next.js route strictly changes (e.g. user navigates to /dashboard)
  useEffect(() => {
    setActiveModal(null);
  }, [pathname]);

  const openModal = useCallback(modalName => {
    setActiveModal(modalName);
    if (LEGAL_MODALS.includes(modalName)) {
      window.location.hash = modalName;
    }
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    // If the hash matches a legal modal, clear it safely without reloading
    const hash = window.location.hash.replace('#', '');
    if (LEGAL_MODALS.includes(hash)) {
      window.history.pushState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
  }, []);

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}
