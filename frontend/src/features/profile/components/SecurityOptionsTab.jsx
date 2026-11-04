'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/ui/feedback/use-toast';
import { totpAPI, twofaAPI, userAPI } from '@/shared/api/client';
import { PasswordStrengthInput } from '@/features/auth/components/security-inputs';
import {
  Download,
  Key,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export function SecurityOptionsTab({ user, resetTotp, verifyResetTotp }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: totpStatus, isLoading: totpStatusLoading } = useQuery({
    queryKey: ['totp', 'status'],
    queryFn: totpAPI.getStatus,
    staleTime: 1000 * 60,
    retry: false,
  });

  const [show2FAResetFlow, setShow2FAResetFlow] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState('verify');
  const [currentTotpCode, setCurrentTotpCode] = useState('');
  const [useBackupForReset, setUseBackupForReset] = useState(false);
  const [newTotpCode, setNewTotpCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);
  const [resetSetupData, setResetSetupData] = useState(null);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePwd = (f, v) => setPasswords(p => ({ ...p, [f]: v }));

  const changePasswordMutation = useMutation({
    mutationFn: data =>
      userAPI.changePassword(data.newPassword, data.currentPassword),
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated securely.',
        variant: 'success',
      });
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: e =>
      toast({
        title: 'Change Password Failed',
        description: e.message || 'Failed to update password.',
        variant: 'destructive',
      }),
  });

  const handleChangePassword = async () => {
    if (!passwords.currentPassword) {
      toast({
        title: 'Validation',
        description: 'Current password required',
        variant: 'destructive',
      });
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast({
        title: 'Validation',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }
    if (passwords.currentPassword === passwords.newPassword) {
      toast({
        title: 'Validation',
        description: 'New password must differ from current password',
        variant: 'destructive',
      });
      return;
    }
    if (!/[A-Z]/.test(passwords.newPassword)) {
      toast({
        title: 'Validation',
        description: 'Password must include at least one uppercase letter',
        variant: 'destructive',
      });
      return;
    }
    if (!/[a-z]/.test(passwords.newPassword)) {
      toast({
        title: 'Validation',
        description: 'Password must include at least one lowercase letter',
        variant: 'destructive',
      });
      return;
    }
    if (!/[0-9]/.test(passwords.newPassword)) {
      toast({
        title: 'Validation',
        description: 'Password must include at least one number',
        variant: 'destructive',
      });
      return;
    }
    if (!/[@$!%*?&#]/.test(passwords.newPassword)) {
      toast({
        title: 'Validation',
        description:
          'Password must include at least one special character (@$!%*?&#)',
        variant: 'destructive',
      });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Validation',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    changePasswordMutation.mutate({
      newPassword: passwords.newPassword,
      currentPassword: passwords.currentPassword,
    });
  };

  const handleInitiate2FAReset = async () => {
    const len = useBackupForReset ? 8 : 6;
    if (!currentTotpCode || currentTotpCode.length !== len) {
      toast({
        title: 'Validation',
        description: `Enter ${useBackupForReset ? '8-digit backup' : '6-digit'} code`,
        variant: 'destructive',
      });
      return;
    }
    setIs2FALoading(true);
    try {
      const result = await resetTotp(currentTotpCode);
      if (result.success) {
        setResetSetupData(result.data);
        setTwoFAStep('newcode');
        setCurrentTotpCode('');
      } else {
        toast({
          title: 'Reset Failed',
          description: result.error || 'Invalid code',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to initiate 2FA reset',
        variant: 'destructive',
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleVerifyNew2FA = async () => {
    if (!newTotpCode || newTotpCode.length !== 6) {
      toast({
        title: 'Validation',
        description: 'Enter 6-digit code',
        variant: 'destructive',
      });
      return;
    }
    setIs2FALoading(true);
    try {
      const result = await verifyResetTotp(newTotpCode);
      if (result.success) {
        setNewBackupCodes(result.backupCodes || []);
        setTwoFAStep('backup');
        setNewTotpCode('');
        queryClient.invalidateQueries({ queryKey: ['totp', 'status'] });
        toast({
          title: '2FA Reset Complete',
          description: 'Save your new backup codes.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: result.error || 'Invalid code',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to verify code',
        variant: 'destructive',
      });
    } finally {
      setIs2FALoading(false);
    }
  };

  const downloadNewBackupCodes = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const content = `COINTRACK · BACKUP CODES\nGenerated: ${formattedDate}\n\n${newBackupCodes.map((c, i) => `[${String(i + 1).padStart(2, '0')}]  ${c}`).join('\n')}\n\nEach code is single-use. Store securely.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `coinTrack_backup-codes_${user?.username || 'user'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const close2FAFlow = () => {
    setShow2FAResetFlow(false);
    setTwoFAStep('verify');
    setCurrentTotpCode('');
    setNewTotpCode('');
    setNewBackupCodes([]);
    setResetSetupData(null);
    setUseBackupForReset(false);
  };

  return (
    <div className='space-y-8 pb-4'>
      <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
        <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
          Security Options
        </h2>
        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
          Manage your multi-factor authentication, backup codes, and
          credentials.
        </p>
      </div>

      {/* Section 1: Two-Factor Authentication (TOTP) */}
      <div className='p-5 sm:p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 space-y-5'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
              <Key className='size-5' />
            </div>
            <div>
              <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
                Two-Factor Authentication (TOTP)
              </h3>
              <p className='text-xs text-neutral-500 dark:text-neutral-400'>
                Secure your login with Google Authenticator, Authy, or
                1Password.
              </p>
            </div>
          </div>

          <div>
            {totpStatusLoading ? (
              <span className='px-3 py-1 rounded-full text-xs font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'>
                Checking...
              </span>
            ) : totpStatus?.enabled ? (
              <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'>
                <span className='size-1.5 rounded-full bg-emerald-500 animate-pulse' />
                Enabled &amp; Protected
              </span>
            ) : (
              <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60'>
                Disabled
              </span>
            )}
          </div>
        </div>

        {/* Status details & Reset trigger button */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60'>
          <p className='text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl'>
            {totpStatus?.enabled
              ? 'Your account requires an authenticator passcode every time you sign in or authorize high-value transactions.'
              : 'Add an extra verification layer to prevent unauthorized access to your portfolio data and broker accounts.'}
          </p>

          <button
            type='button'
            onClick={() => {
              setShow2FAResetFlow(prev => !prev);
            }}
            className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shrink-0 shadow-xs cursor-pointer'
          >
            <Key className='size-3.5' />
            <span>{show2FAResetFlow ? 'Close Reset' : 'Reset 2FA Setup'}</span>
          </button>
        </div>

        {/* Interactive Multi-Step 2FA Reset Flow */}
        {show2FAResetFlow && (
          <div className='p-5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-4 transition-all'>
            {twoFAStep === 'verify' && (
              <div className='space-y-4'>
                <div>
                  <h4 className='text-sm font-bold text-foreground'>
                    Verify Identity to Reset 2FA
                  </h4>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                    {useBackupForReset
                      ? 'Enter one of your 8-digit emergency recovery backup codes.'
                      : 'Enter the 6-digit verification code from your current authenticator app.'}
                  </p>
                </div>

                <div className='max-w-xs space-y-1.5'>
                  <label className='block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    {useBackupForReset ? 'Backup Code' : 'Authenticator Code'}
                  </label>
                  <input
                    type='text'
                    maxLength={useBackupForReset ? 8 : 6}
                    value={currentTotpCode}
                    onChange={e =>
                      setCurrentTotpCode(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    placeholder={useBackupForReset ? '12345678' : '000000'}
                    className='w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tracking-widest'
                  />
                </div>

                <div className='flex items-center justify-between pt-1'>
                  <button
                    type='button'
                    onClick={() => {
                      setUseBackupForReset(!useBackupForReset);
                      setCurrentTotpCode('');
                    }}
                    className='text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                  >
                    {useBackupForReset
                      ? 'Use 6-digit authenticator code instead'
                      : 'Lost phone? Use an 8-digit backup code'}
                  </button>

                  <button
                    type='button'
                    onClick={handleInitiate2FAReset}
                    disabled={
                      is2FALoading ||
                      currentTotpCode.length !== (useBackupForReset ? 8 : 6)
                    }
                    className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50'
                  >
                    {is2FALoading && (
                      <Loader2 className='size-3.5 animate-spin' />
                    )}
                    <span>Continue</span>
                  </button>
                </div>

                {/* Lost everything recovery link */}
                <div className='pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60'>
                  {!showRecoveryConfirm ? (
                    <button
                      type='button'
                      onClick={() => setShowRecoveryConfirm(true)}
                      className='text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer'
                    >
                      <ShieldAlert className='size-3.5' />
                      <span>
                        Lost access to everything? Request email recovery link
                      </span>
                    </button>
                  ) : (
                    <div className='p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5'>
                      <p className='text-xs text-rose-900 dark:text-rose-200'>
                        Send a 2FA disable and recovery link to{' '}
                        <strong className='font-mono'>{user?.email}</strong>?
                      </p>
                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => setShowRecoveryConfirm(false)}
                          className='px-3 py-1 rounded text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 cursor-pointer'
                        >
                          Cancel
                        </button>
                        <button
                          type='button'
                          onClick={async () => {
                            setIsSendingRecovery(true);
                            try {
                              await twofaAPI.requestRecovery(user.email);
                              toast({
                                title: 'Recovery Link Dispatched',
                                description:
                                  'Check your email inbox for instructions.',
                                variant: 'success',
                              });
                              close2FAFlow();
                              setShowRecoveryConfirm(false);
                            } catch (err) {
                              toast({
                                title: 'Error',
                                description: err.message || 'Failed',
                                variant: 'destructive',
                              });
                            } finally {
                              setIsSendingRecovery(false);
                            }
                          }}
                          disabled={isSendingRecovery}
                          className='px-3 py-1 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50'
                        >
                          {isSendingRecovery
                            ? 'Sending...'
                            : 'Confirm Send Recovery Link'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {twoFAStep === 'newcode' && resetSetupData && (
              <div className='space-y-4'>
                <div>
                  <h4 className='text-sm font-bold text-foreground'>
                    Scan New Authenticator Secret
                  </h4>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                    Scan the QR code in your app, then enter the generated
                    6-digit code.
                  </p>
                </div>

                {resetSetupData.qrCodeBase64 && (
                  <div className='flex justify-center p-4 bg-white rounded-xl border border-neutral-200 w-fit mx-auto shadow-xs'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resetSetupData.qrCodeBase64}
                      alt='TOTP QR Code'
                      className='size-44 object-contain'
                    />
                  </div>
                )}

                {resetSetupData.secret && (
                  <div className='text-center space-y-1'>
                    <p className='text-[11px] text-neutral-500 uppercase tracking-wider font-semibold'>
                      Manual Entry Secret
                    </p>
                    <code className='px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-mono font-bold text-foreground inline-block select-all'>
                      {resetSetupData.secret}
                    </code>
                  </div>
                )}

                <div className='max-w-xs mx-auto space-y-1.5'>
                  <label className='block text-xs font-semibold text-center text-neutral-700 dark:text-neutral-300'>
                    Enter 6-Digit Code from App
                  </label>
                  <input
                    type='text'
                    maxLength={6}
                    value={newTotpCode}
                    onChange={e =>
                      setNewTotpCode(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    placeholder='000000'
                    className='w-full h-12 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center text-xl font-mono tracking-[0.3em] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  />
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={close2FAFlow}
                    className='px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={handleVerifyNew2FA}
                    disabled={is2FALoading || newTotpCode.length !== 6}
                    className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50'
                  >
                    {is2FALoading && (
                      <Loader2 className='size-3.5 animate-spin' />
                    )}
                    <span>Verify &amp; Activate</span>
                  </button>
                </div>
              </div>
            )}

            {twoFAStep === 'backup' && (
              <div className='space-y-4'>
                <div className='p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60'>
                  <p className='text-xs font-bold text-emerald-800 dark:text-emerald-200'>
                    ✓ 2FA Successfully Reconfigured
                  </p>
                  <p className='text-xs text-emerald-700 dark:text-emerald-300 mt-1'>
                    Store these single-use backup codes safely. They are
                    required if you ever lose your phone.
                  </p>
                </div>

                <div className='grid grid-cols-2 gap-2.5'>
                  {newBackupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className='p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900 text-center font-mono text-xs font-bold text-foreground'
                    >
                      [{String(idx + 1).padStart(2, '0')}] {code}
                    </div>
                  ))}
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={downloadNewBackupCodes}
                    className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer'
                  >
                    <Download className='size-3.5' />
                    <span>Download Codes (.txt)</span>
                  </button>
                  <button
                    type='button'
                    onClick={close2FAFlow}
                    className='px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer'
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Reset Password */}
      <div className='p-5 sm:p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 space-y-5'>
        <div className='flex items-center gap-3'>
          <div className='size-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0'>
            <Lock className='size-5' />
          </div>
          <div>
            <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
              Reset Password
            </h3>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
              Update your account password with real-time security validation.
            </p>
          </div>
        </div>

        <div className='space-y-4 pt-1'>
          {/* Current Password */}
          <PasswordStrengthInput
            id='security-current-password'
            label='Current Password'
            labelClassName='text-xs font-semibold text-neutral-700 dark:text-neutral-300'
            value={passwords.currentPassword}
            onChange={e => handlePwd('currentPassword', e.target.value)}
            placeholder='Enter current password...'
            showRules={false}
            showStrengthBar={false}
            autoComplete='current-password'
            containerClassName='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl'
            inputClassName='font-mono text-xs sm:text-sm'
          />

          {/* New Password with Strength Meter & Rules */}
          <PasswordStrengthInput
            id='security-new-password'
            label='New Password'
            labelClassName='text-xs font-semibold text-neutral-700 dark:text-neutral-300'
            value={passwords.newPassword}
            onChange={e => handlePwd('newPassword', e.target.value)}
            placeholder='Enter new password...'
            showRules={true}
            showStrengthBar={true}
            autoComplete='new-password'
            containerClassName='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl'
            inputClassName='font-mono text-xs sm:text-sm'
          />

          {/* Confirm New Password */}
          <PasswordStrengthInput
            id='security-confirm-password'
            label='Confirm New Password'
            labelClassName='text-xs font-semibold text-neutral-700 dark:text-neutral-300'
            value={passwords.confirmPassword}
            onChange={e => handlePwd('confirmPassword', e.target.value)}
            placeholder='Re-enter new password...'
            showRules={false}
            showStrengthBar={false}
            autoComplete='new-password'
            containerClassName='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl'
            inputClassName='font-mono text-xs sm:text-sm'
          />
        </div>

        <div className='flex justify-end pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60'>
          <button
            type='button'
            onClick={handleChangePassword}
            disabled={
              changePasswordMutation.isPending ||
              !passwords.currentPassword ||
              !passwords.newPassword ||
              !passwords.confirmPassword
            }
            className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs'
          >
            {changePasswordMutation.isPending ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <ShieldCheck className='size-3.5' />
            )}
            <span>Reset Password</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecurityOptionsTab;
