'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

const ModalContext = createContext({
    activeModal: null,
    openModal: () => { },
    closeModal: () => { },
});

export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }) {
    const [activeModal, setActiveModal] = useState(null);
    const pathname = usePathname();

    // Close modals on route change
    useEffect(() => {
        setActiveModal(null);
    }, [pathname]);

    const openModal = (modalName) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);

    return (
        <ModalContext.Provider value={{ activeModal, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
}
