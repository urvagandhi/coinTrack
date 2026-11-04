'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/ui/feedback/use-toast';
import { userAPI } from '@/shared/api/client';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function DangerZoneTab({ apiUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userAPI.deleteAccount(deletePassword);
      setShowDeleteConfirm(false);
      setDeletePassword('');
      toast({
        title: 'Account deleted',
        description: 'All your data has been permanently removed.',
        variant: 'success',
      });
      queryClient.clear();
      window.location.assign('/');
    } catch (err) {
      toast({
        title: "Couldn't delete account",
        description:
          err.message || 'Please verify your password and try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className='space-y-6 pb-4'>
      <div className='pb-5 border-b border-rose-200/60 dark:border-rose-900/60'>
        <h2 className='text-lg sm:text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400'>
          Danger Zone
        </h2>
        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
          Irreversible account operations and permanent data erasure.
        </p>
      </div>

      <div className='p-5 sm:p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-4'>
        <div className='flex items-start gap-3.5'>
          <div className='size-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5'>
            <AlertTriangle className='size-5' />
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm sm:text-base font-bold text-rose-900 dark:text-rose-200 tracking-tight'>
              Delete Account and Wipe All Financial Records
            </h3>
            <p className='text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed'>
              Permanently delete your profile, stock holdings, mutual fund
              schemes, fixed deposits, EPF/PPF records, notes, and broker sync
              tokens. Once initiated, this action cannot be recovered or undone.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <div className='pt-2 flex justify-end'>
            <button
              type='button'
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeletePassword('');
              }}
              className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs'
            >
              <AlertTriangle className='size-3.5' />
              <span>Delete My Account</span>
            </button>
          </div>
        ) : (
          <div className='pt-3 border-t border-rose-200 dark:border-rose-900/60 space-y-3.5'>
            <p className='text-xs font-semibold text-rose-900 dark:text-rose-200'>
              Please enter your password to confirm permanent account deletion:
            </p>

            <input
              type='password'
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              autoComplete='current-password'
              placeholder={
                apiUser?.authProvider === 'GOOGLE'
                  ? 'Google account — leave blank'
                  : 'Enter your password to authorize deletion'
              }
              className='w-full h-11 px-3.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono'
            />

            <div className='flex items-center justify-end gap-2.5 pt-1'>
              <button
                type='button'
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className='px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleDeleteAccount}
                disabled={
                  isDeleting ||
                  (!deletePassword && apiUser?.authProvider !== 'GOOGLE')
                }
                className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs'
              >
                {isDeleting && <Loader2 className='size-3.5 animate-spin' />}
                <span>Permanently Delete Everything</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DangerZoneTab;
