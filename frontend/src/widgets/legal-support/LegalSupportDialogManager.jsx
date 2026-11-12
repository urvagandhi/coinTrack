'use client';

import LegalHubDialog from './LegalHubDialog';
import ContactSupportDialog from './ContactSupportDialog';

export default function LegalSupportDialogManager() {
  return (
    <>
      <LegalHubDialog />
      <ContactSupportDialog />
    </>
  );
}

export const DialogManager = LegalSupportDialogManager;
export const ModalManager = LegalSupportDialogManager;
