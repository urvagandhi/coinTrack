'use client';

import { useToast } from '@/shared/ui/feedback/use-toast';
import { useAuth } from '@/shared/auth/AuthContext';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { cn } from '@/shared/lib/utils';
import { emailAPI, totpAPI, twofaAPI, userAPI } from '@/shared/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Key,
  Laptop,
  Loader2,
  Lock,
  Mail,
  Moon,
  Pencil,
  Save,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  User,
  X,
} from 'lucide-react';
import { PasswordStrengthInput } from '@/features/auth/components/security-inputs';
import { useEffect, useRef, useState } from 'react';

const NOTIF_LABELS = {
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

export function ProfileView() {
  const { user, resetTotp, verifyResetTotp, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('profile');

  const { data: apiUser } = useQuery({
    queryKey: ['profile'],
    queryFn: userAPI.getProfile,
    initialData: user,
    staleTime: 1000 * 60 * 5,
  });

  const isEmailVerified = Boolean(
    apiUser?.isEmailVerified ??
    apiUser?.emailVerified ??
    user?.isEmailVerified ??
    user?.emailVerified
  );

  const isPendingEmailExpired = Boolean(
    apiUser?.pendingEmailExpiresAt &&
    new Date(apiUser.pendingEmailExpiresAt).getTime() < Date.now()
  );

  const { data: totpStatus, isLoading: totpStatusLoading } = useQuery({
    queryKey: ['totp', 'status'],
    queryFn: totpAPI.getStatus,
    staleTime: 1000 * 60,
    retry: false,
  });

  const [isEditing, setIsEditing] = useState(false);
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
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isResendingChange, setIsResendingChange] = useState(false);
  const [isCancellingChange, setIsCancellingChange] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const cancelledRef = useRef(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Preference states
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [maskBalances, setMaskBalances] = useState(false);

  const [profileData, setProfileData] = useState({
    name: apiUser?.name || '',
    username: apiUser?.username || '',
    email: apiUser?.email || '',
    bio: apiUser?.bio || '',
    location: apiUser?.location || '',
    phoneNumber: apiUser?.mobile || apiUser?.phoneNumber || '',
    joinDate: apiUser?.createdAt
      ? new Date(apiUser.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    notifications: {
      priceAlerts: true,
      portfolioUpdates: true,
      marketNews: false,
      weeklyReports: true,
    },
  });

  useEffect(() => {
    if (apiUser) {
      setProfileData(prev => ({
        ...prev,
        name: apiUser.name || apiUser.firstName || '',
        username: apiUser.username || '',
        email: apiUser.email || '',
        phoneNumber: apiUser.mobile || apiUser.phoneNumber || '',
        bio: apiUser.bio || '',
        location: apiUser.location || '',
        joinDate: apiUser.createdAt
          ? new Date(apiUser.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : prev.joinDate,
      }));
    }
  }, [apiUser]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (f, v) => setProfileData(p => ({ ...p, [f]: v }));

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      const result = await emailAPI.resend();
      if (result?.alreadyVerified) {
        toast({
          title: 'Already verified',
          description: 'Your email address is already verified.',
          variant: 'success',
        });
        queryClient.setQueryData(['profile'], old =>
          old ? { ...old, emailVerified: true, isEmailVerified: true } : old
        );
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        toast({
          title: 'Verification email sent',
          description: `A fresh link has been dispatched to ${profileData.email}.`,
          variant: 'success',
        });
      }
    } catch (err) {
      toast({
        title: "Couldn't resend",
        description: err.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleResendPendingEmailChange = async () => {
    if (
      !apiUser?.pendingEmail ||
      isCancellingChange ||
      isResendingChange ||
      resendCooldown > 0
    )
      return;
    cancelledRef.current = false;
    setIsResendingChange(true);
    try {
      await emailAPI.change(apiUser.pendingEmail);
      if (cancelledRef.current) return;
      setResendCooldown(60);
      toast({
        title: 'Verification Link Resent',
        description: `A fresh confirmation link has been sent to ${apiUser.pendingEmail}.`,
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      if (cancelledRef.current) return;
      toast({
        title: "Couldn't Resend Link",
        description: err.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsResendingChange(false);
    }
  };

  const handleCancelPendingEmailChange = async () => {
    if (isCancellingChange) return;
    // Cancellation takes immediate, non-negotiable priority over any in-flight resend
    cancelledRef.current = true;
    setIsCancellingChange(true);
    setIsResendingChange(false);
    setResendCooldown(0);
    try {
      await emailAPI.cancelChange();
      toast({
        title: 'Email Change Cancelled',
        description: 'Pending email change request has been discarded.',
        variant: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Could not cancel pending change.',
        variant: 'destructive',
      });
    } finally {
      setIsCancellingChange(false);
    }
  };

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

  const handleNotif = (f, v) => {
    setProfileData(p => ({
      ...p,
      notifications: { ...p.notifications, [f]: v },
    }));
    toast({
      variant: v ? 'success' : 'info',
      title: v ? 'Notification Enabled' : 'Notification Paused',
      description: `${NOTIF_LABELS[f]?.title || 'Channel'} has been ${v ? 'activated' : 'paused'}.`,
    });
  };

  const handlePwd = (f, v) => setPasswords(p => ({ ...p, [f]: v }));

  const updateProfileMutation = useMutation({
    mutationFn: data => userAPI.updateProfile(data),
    onSuccess: updatedUser => {
      queryClient.setQueryData(['profile'], updatedUser);
      toast({
        title: 'Profile Updated',
        description: 'Your profile details have been saved.',
        variant: 'success',
      });
      setIsEditing(false);
    },
    onError: e =>
      toast({
        title: 'Update Failed',
        description: e.message || 'Failed to update profile.',
        variant: 'destructive',
      }),
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const isSaveLoading = isSaving || updateProfileMutation.isPending;

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

  const originalProfile = {
    name: apiUser?.name || apiUser?.firstName || '',
    username: apiUser?.username || '',
    email: (apiUser?.email || '').toLowerCase().trim(),
    bio: apiUser?.bio || '',
    location: apiUser?.location || '',
    phoneNumber: (apiUser?.mobile || apiUser?.phoneNumber || '')
      .replace(/^\+91/, '')
      .replace(/\D/g, ''),
  };

  const cleanPhone = v => (v || '').replace(/^\+91/, '').replace(/\D/g, '');

  const hasChanges =
    profileData.name !== originalProfile.name ||
    profileData.username !== originalProfile.username ||
    profileData.email.trim().toLowerCase() !== originalProfile.email ||
    (profileData.bio || '') !== originalProfile.bio ||
    (profileData.location || '') !== originalProfile.location ||
    cleanPhone(profileData.phoneNumber) !== originalProfile.phoneNumber;

  const buildChangedPayload = (formattedMobile = null) => {
    const changed = {};
    if (profileData.username !== originalProfile.username)
      changed.username = profileData.username.trim();
    if (profileData.name !== originalProfile.name)
      changed.name = profileData.name;
    if ((profileData.bio || '') !== originalProfile.bio)
      changed.bio = profileData.bio;
    if ((profileData.location || '') !== originalProfile.location)
      changed.location = profileData.location;
    if (cleanPhone(profileData.phoneNumber) !== originalProfile.phoneNumber)
      changed.phoneNumber = formattedMobile;
    return changed;
  };

  const handleSaveProfile = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = (profileData.email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      toast({
        title: 'Validation',
        description: 'Email address is required',
        variant: 'destructive',
      });
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: 'Validation',
        description: 'Invalid email address format',
        variant: 'destructive',
      });
      return;
    }

    let cleanedMobile = (profileData.phoneNumber || '')
      .replace(/^\+91/, '')
      .replace(/\D/g, '');
    if (cleanedMobile.length > 10) cleanedMobile = cleanedMobile.slice(-10);
    if (cleanedMobile && cleanedMobile.length !== 10) {
      toast({
        title: 'Validation',
        description: 'Mobile number must be exactly 10 digits',
        variant: 'destructive',
      });
      return;
    }
    if (cleanedMobile && !/^[6-9]\d{9}$/.test(cleanedMobile)) {
      toast({
        title: 'Validation',
        description: 'Invalid Indian mobile number format',
        variant: 'destructive',
      });
      return;
    }

    const formattedMobile = cleanedMobile ? `+91${cleanedMobile}` : null;

    const originalEmail = (apiUser?.email || '').toLowerCase().trim();
    let emailChangeInitiated = false;

    setIsSaving(true);

    try {
      if (trimmedEmail !== originalEmail) {
        try {
          await emailAPI.change(trimmedEmail);
          emailChangeInitiated = true;
          setResendCooldown(60);
          toast({
            title: 'Verification Email Sent',
            description: `A confirmation link has been sent to ${trimmedEmail}. Confirm via the link to update your email.`,
            variant: 'success',
          });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        } catch (e) {
          toast({
            title: 'Email Change Failed',
            description: e.message || 'Failed to initiate email change.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }

      const payload = buildChangedPayload(formattedMobile);
      const hasOtherChanges = Object.keys(payload).length > 0;

      if (hasOtherChanges) {
        updateProfileMutation.mutate(payload, {
          onSuccess: () => {
            if (emailChangeInitiated) {
              setProfileData(prev => ({ ...prev, email: originalEmail }));
            }
          },
        });
      } else {
        if (emailChangeInitiated) {
          setProfileData(prev => ({ ...prev, email: originalEmail }));
          setIsEditing(false);
        }
        setIsSaving(false);
      }
    } catch {
      setIsSaving(false);
    }
  };

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
    a.download = `coinTrack_backup-codes_${apiUser?.username || 'user'}.txt`;
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

  const displayName = profileData.name || profileData.username || 'Urva Gandhi';

  const SETTINGS_TABS = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'security', label: 'Security Options', icon: ShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className='w-full h-full min-h-0 flex-1 flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch md:overflow-hidden'>
      {/* ── LEFT SETTINGS NAVIGATION SIDEBAR (Non-scrolling static docked) ── */}
      <aside className='w-full md:w-60 lg:w-64 shrink-0 space-y-6 self-start'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
            Settings
          </h1>
          <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1'>
            You can find all settings here.
          </p>
        </div>

        <nav className='flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none'>
          {SETTINGS_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'profile') setIsEditing(false);
                }}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap text-left shrink-0 md:shrink md:w-full',
                  isActive
                    ? isDanger
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-semibold shadow-xs'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold shadow-xs'
                    : isDanger
                      ? 'text-rose-500/80 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    isActive
                      ? isDanger
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-blue-600 dark:text-blue-400'
                      : isDanger
                        ? 'text-rose-500/70'
                        : 'text-neutral-400 dark:text-neutral-500'
                  )}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── RIGHT MAIN SETTINGS CONTENT CARD ── */}
      <section
        aria-label='Settings Content'
        className='flex-1 h-full min-h-0 w-full min-w-0 bg-white dark:bg-[#151619] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs transition-colors overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent overscroll-contain'
      >
        {/* TAB 1: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className='space-y-6 sm:space-y-7'>
            {/* Header + Edit Button */}
            <div className='flex items-center justify-between gap-4 pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
              <div>
                <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
                  Profile Information
                </h2>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                  Manage your personal identity, contact details, and
                  credentials.
                </p>
              </div>

              {!isEditing ? (
                <button
                  type='button'
                  onClick={() => setIsEditing(true)}
                  className='inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer active:scale-95'
                >
                  <Pencil className='size-3.5' />
                  <span>Edit</span>
                </button>
              ) : (
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    disabled={isSaveLoading}
                    onClick={() => {
                      setIsEditing(false);
                      // Restore original
                      if (apiUser) {
                        setProfileData(prev => ({
                          ...prev,
                          name: apiUser.name || apiUser.firstName || '',
                          username: apiUser.username || '',
                          email: apiUser.email || '',
                          phoneNumber:
                            apiUser.mobile || apiUser.phoneNumber || '',
                          bio: apiUser.bio || '',
                          location: apiUser.location || '',
                        }));
                      }
                    }}
                    className='inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none'
                  >
                    <X className='size-3.5' />
                    <span>Cancel</span>
                  </button>
                  <button
                    type='button'
                    onClick={handleSaveProfile}
                    disabled={isSaveLoading || !hasChanges}
                    className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-95 min-w-[115px] justify-center'
                  >
                    {isSaveLoading ? (
                      <>
                        <Loader2 className='size-3.5 animate-spin' />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className='size-3.5' />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* User Avatar & Headline Row */}
            <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5'>
              <div className='relative inline-block shrink-0'>
                <div className='size-16 sm:size-20 rounded-full ring-2 ring-blue-500/20 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shadow-xs'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName || 'User'}`}
                    alt={displayName}
                    className='w-full h-full object-cover'
                  />
                </div>
                <button
                  type='button'
                  onClick={() => setIsEditing(true)}
                  className='absolute bottom-0 right-0 size-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer'
                  title='Change Avatar'
                >
                  <Camera className='size-3.5' />
                </button>
              </div>

              <div className='space-y-1 min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='text-base sm:text-lg font-bold text-foreground tracking-tight'>
                    {displayName}
                  </h3>
                  {isEmailVerified ? (
                    <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50'>
                      <BadgeCheck className='size-3' />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50'>
                      <ShieldAlert className='size-3' />
                      <span>Unverified Email</span>
                    </span>
                  )}
                </div>
                <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate'>
                  @{profileData.username || 'username'} · Member since{' '}
                  {profileData.joinDate}
                </p>
              </div>
            </div>

            {/* Section: Personal Details */}
            <div className='pt-2 space-y-4'>
              <h4 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
                Personal Details
              </h4>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                {/* Full Name */}
                <div className='space-y-1.5'>
                  <label className='block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={profileData.name}
                      onChange={e => handleChange('name', e.target.value)}
                      placeholder='Urva Gandhi'
                      className='w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 focus:bg-white dark:focus:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                    />
                  ) : (
                    <div className='w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs sm:text-sm text-foreground flex items-center'>
                      {profileData.name || (
                        <span className='text-neutral-400 italic'>Not set</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Username */}
                <div className='space-y-1.5'>
                  <label className='block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Username
                  </label>
                  {isEditing ? (
                    <div className='relative'>
                      <span className='absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 text-xs sm:text-sm pointer-events-none'>
                        @
                      </span>
                      <input
                        type='text'
                        value={profileData.username}
                        onChange={e => handleChange('username', e.target.value)}
                        placeholder='urva_gandhi'
                        className='w-full h-11 pl-8 pr-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 focus:bg-white dark:focus:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono'
                      />
                    </div>
                  ) : (
                    <div className='w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs sm:text-sm text-foreground font-mono flex items-center'>
                      @{profileData.username || 'not_set'}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div className='space-y-1.5 sm:col-span-2'>
                  <div className='flex items-center justify-between'>
                    <label className='block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                      Email Address <span className='text-rose-500'>*</span>
                    </label>
                    {isEmailVerified && (
                      <span className='inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400'>
                        <CheckCircle2 className='size-3' /> Verified
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <div>
                      <input
                        type='email'
                        value={profileData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        placeholder='urvagandhi24@gmail.com'
                        className='w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 focus:bg-white dark:focus:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                      />
                      {profileData.email.trim().toLowerCase() !==
                        originalProfile.email && (
                        <p className='text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1'>
                          <span>ⓘ</span> Changing email requires verification. A
                          confirmation link will be sent to the new address.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className='w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs sm:text-sm text-foreground flex items-center justify-between'>
                      <span>{profileData.email}</span>
                      {isEmailVerified ? (
                        <span className='text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full'>
                          Verified
                        </span>
                      ) : (
                        <span className='text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full'>
                          Pending Verification
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pending Email Change Notice */}
                  {!isEditing && apiUser?.pendingEmail && (
                    <div
                      className={cn(
                        'mt-2.5 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                        isPendingEmailExpired
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50'
                          : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/50'
                      )}
                    >
                      <div className='flex items-start gap-2.5 min-w-0'>
                        {isPendingEmailExpired ? (
                          <AlertTriangle className='size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
                        ) : (
                          <Mail className='size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5' />
                        )}
                        <div
                          className={cn(
                            'text-xs',
                            isPendingEmailExpired
                              ? 'text-amber-900 dark:text-amber-200'
                              : 'text-blue-900 dark:text-blue-200'
                          )}
                        >
                          <p>
                            Change to{' '}
                            <strong className='font-mono font-semibold'>
                              {apiUser.pendingEmail}
                            </strong>{' '}
                            {isPendingEmailExpired
                              ? 'link has expired.'
                              : 'is pending confirmation.'}
                          </p>
                          <p
                            className={cn(
                              'text-[11px] mt-0.5',
                              isPendingEmailExpired
                                ? 'text-amber-700/80 dark:text-amber-300/80'
                                : 'text-blue-700/80 dark:text-blue-300/80'
                            )}
                          >
                            {isPendingEmailExpired
                              ? 'The 10-minute link expired. Click "Resend Fresh Link", or "Cancel" to keep your current email.'
                              : 'Verification link valid for 10 minutes. Please check your inbox to confirm.'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 shrink-0 self-end sm:flex-nowrap'>
                        <button
                          type='button'
                          onClick={handleResendPendingEmailChange}
                          disabled={
                            isResendingChange ||
                            isCancellingChange ||
                            resendCooldown > 0
                          }
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-xs min-w-[124px] justify-center',
                            isPendingEmailExpired
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          )}
                        >
                          {isResendingChange ? (
                            <>
                              <Loader2 className='size-3.5 animate-spin' />
                              <span>Sending...</span>
                            </>
                          ) : resendCooldown > 0 ? (
                            <>
                              <Clock className='size-3.5 text-white/80' />
                              <span>Resend in {resendCooldown}s</span>
                            </>
                          ) : (
                            <>
                              <Mail className='size-3.5' />
                              <span>
                                {isPendingEmailExpired
                                  ? 'Resend Fresh Link'
                                  : 'Resend Link'}
                              </span>
                            </>
                          )}
                        </button>
                        <button
                          type='button'
                          onClick={handleCancelPendingEmailChange}
                          disabled={isCancellingChange}
                          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none min-w-[110px] justify-center'
                        >
                          {isCancellingChange ? (
                            <>
                              <Loader2 className='size-3.5 animate-spin' />
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <>
                              <X className='size-3.5' />
                              <span>Cancel Change</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email Verification Action Callout (shown if not verified and not editing) */}
                  {!isEditing && apiUser && !isEmailVerified && (
                    <div className='mt-2.5 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                      <div className='flex items-start gap-2.5'>
                        <ShieldAlert className='size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
                        <p className='text-xs text-amber-900 dark:text-amber-200 leading-relaxed'>
                          Your email{' '}
                          <strong className='font-mono'>
                            {profileData.email}
                          </strong>{' '}
                          is not verified yet. Verification ensures account
                          recovery and security alerts.
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50'
                      >
                        {isResendingVerification ? (
                          <Loader2 className='size-3.5 animate-spin' />
                        ) : (
                          <Mail className='size-3.5' />
                        )}
                        <span>Resend Verification Email</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className='space-y-1.5'>
                  <label className='block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Phone Number
                  </label>
                  {isEditing ? (
                    <div className='relative'>
                      <span className='absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 text-xs sm:text-sm font-mono pointer-events-none'>
                        +91
                      </span>
                      <input
                        type='tel'
                        maxLength={10}
                        value={cleanPhone(profileData.phoneNumber)}
                        onChange={e =>
                          handleChange(
                            'phoneNumber',
                            e.target.value.replace(/\D/g, '')
                          )
                        }
                        placeholder='8866241204'
                        className='w-full h-11 pl-12 pr-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 focus:bg-white dark:focus:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono'
                      />
                    </div>
                  ) : (
                    <div className='w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs sm:text-sm text-foreground font-mono flex items-center'>
                      {profileData.phoneNumber ? (
                        `+91 ${cleanPhone(profileData.phoneNumber)}`
                      ) : (
                        <span className='text-neutral-400 italic font-sans'>
                          Not provided
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className='space-y-1.5'>
                  <label className='block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    City / Location
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={profileData.location}
                      onChange={e => handleChange('location', e.target.value)}
                      placeholder='Ankleshwar, Gujarat'
                      className='w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 focus:bg-white dark:focus:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                    />
                  ) : (
                    <div className='w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs sm:text-sm text-foreground flex items-center'>
                      {profileData.location || (
                        <span className='text-neutral-400 italic'>
                          Not provided
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className='space-y-1.5 sm:col-span-2'>
                  <label className='block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Bio / Tagline
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={profileData.bio}
                      onChange={e => handleChange('bio', e.target.value)}
                      placeholder='Tell us a bit about your investment focus...'
                      className='w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 focus:bg-white dark:focus:bg-neutral-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none'
                    />
                  ) : (
                    <div className='w-full min-h-16 px-3.5 py-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs sm:text-sm text-foreground leading-relaxed'>
                      {profileData.bio || (
                        <span className='text-neutral-400 italic'>
                          No biography added yet.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions when Editing
            {isEditing && (
              <div className='flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]'>
                <button
                  type='button'
                  onClick={() => {
                    setIsEditing(false);
                    if (apiUser) {
                      setProfileData(prev => ({
                        ...prev,
                        name: apiUser.name || apiUser.firstName || '',
                        username: apiUser.username || '',
                        email: apiUser.email || '',
                        phoneNumber:
                          apiUser.mobile || apiUser.phoneNumber || '',
                        bio: apiUser.bio || '',
                        location: apiUser.location || '',
                      }));
                    }
                  }}
                  className='inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer'
                >
                  <X className='size-3.5' />
                  <span>Cancel</span>
                </button>
                <button
                  type='button'
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending || !hasChanges}
                  className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-95'
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <Save className='size-3.5' />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )} */}
          </div>
        )}

        {/* TAB 2: SECURITY OPTIONS */}
        {activeTab === 'security' && (
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
                  <span>
                    {show2FAResetFlow ? 'Close Reset' : 'Reset 2FA Setup'}
                  </span>
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
                            ? 'Enter one of your 8-digit emergency backup codes.'
                            : 'Enter the 6-digit code currently shown in your authenticator app.'}
                        </p>
                      </div>

                      <div className='max-w-xs'>
                        <input
                          type='text'
                          maxLength={useBackupForReset ? 8 : 6}
                          value={currentTotpCode}
                          onChange={e =>
                            setCurrentTotpCode(
                              e.target.value.replace(/[^0-9]/g, '')
                            )
                          }
                          placeholder={
                            useBackupForReset ? '00000000' : '000000'
                          }
                          className='w-full h-12 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center text-xl font-mono tracking-[0.3em] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                        />
                      </div>

                      <div className='flex items-center justify-between flex-wrap gap-3 pt-2'>
                        <button
                          type='button'
                          onClick={() => {
                            setUseBackupForReset(!useBackupForReset);
                            setCurrentTotpCode('');
                          }}
                          className='text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                        >
                          {useBackupForReset
                            ? '← Use 6-Digit Authenticator Code'
                            : 'Lost device? Use Backup Code →'}
                        </button>

                        <div className='flex items-center gap-2'>
                          <button
                            type='button'
                            onClick={close2FAFlow}
                            className='px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer'
                          >
                            Cancel
                          </button>
                          <button
                            type='button'
                            onClick={handleInitiate2FAReset}
                            disabled={
                              is2FALoading ||
                              currentTotpCode.length !==
                                (useBackupForReset ? 8 : 6)
                            }
                            className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs'
                          >
                            {is2FALoading && (
                              <Loader2 className='size-3.5 animate-spin' />
                            )}
                            <span>Continue</span>
                          </button>
                        </div>
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
                              Lost access to everything? Request email recovery
                              link
                            </span>
                          </button>
                        ) : (
                          <div className='p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5'>
                            <p className='text-xs text-rose-900 dark:text-rose-200'>
                              Send a 2FA disable and recovery link to{' '}
                              <strong className='font-mono'>
                                {user?.email}
                              </strong>
                              ?
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
                            setNewTotpCode(
                              e.target.value.replace(/[^0-9]/g, '')
                            )
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
                    Update your account password with real-time security
                    validation.
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
        )}

        {/* TAB 3: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className='space-y-7 pb-4'>
            <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
              <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
                Preferences
              </h2>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                Customize your display theme, base currency, and interface
                behavior.
              </p>
            </div>

            {/* Theme / Appearance */}
            <div className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 space-y-4'>
              <div>
                <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
                  Interface Appearance
                </h3>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                  Select your preferred color theme or match your system
                  setting.
                </p>
              </div>

              <div className='grid grid-cols-3 gap-3 max-w-md'>
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map(item => {
                  const ItemIcon = item.icon;
                  const isCurrent = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => setTheme(item.id)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                        isCurrent
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      )}
                    >
                      <ItemIcon className='size-4' />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency Format */}
            <div className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 space-y-4'>
              <div>
                <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
                  Base Currency
                </h3>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                  Choose the primary reporting currency for valuation
                  calculations.
                </p>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                {[
                  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
                  { code: 'USD', symbol: '$', label: 'US Dollar' },
                  { code: 'EUR', symbol: '€', label: 'Euro' },
                  { code: 'GBP', symbol: '£', label: 'British Pound' },
                ].map(curr => {
                  const isSelected = selectedCurrency === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type='button'
                      onClick={() => {
                        setSelectedCurrency(curr.code);
                        toast({
                          title: 'Currency Updated',
                          description: `Default currency set to ${curr.code} (${curr.symbol}).`,
                        });
                      }}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left',
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      )}
                    >
                      <span className='size-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-mono font-bold'>
                        {curr.symbol}
                      </span>
                      <div>
                        <div className='font-bold'>{curr.code}</div>
                        <div className='text-[10px] text-neutral-400 font-normal truncate'>
                          {curr.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy Mode Toggle */}
            <div className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 flex items-center justify-between gap-4'>
              <div>
                <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
                  Mask Balances for Privacy
                </h3>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-lg leading-relaxed'>
                  Hide sensitive portfolio values (e.g. ₹••••••) across
                  dashboard cards when working in public spaces or presenting.
                </p>
              </div>

              <button
                type='button'
                onClick={() => setMaskBalances(!maskBalances)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer',
                  maskBalances
                    ? 'bg-blue-600'
                    : 'bg-neutral-200 dark:bg-neutral-800'
                )}
                aria-pressed={maskBalances}
              >
                <span
                  className={cn(
                    'inline-block size-4 rounded-full bg-white transition-transform shadow-xs',
                    maskBalances ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className='space-y-2 pb-4'>
            <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
              <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
                Notifications
              </h2>
              <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                Choose which financial alerts and portfolio reports you wish to
                receive.
              </p>
            </div>

            <div className='divide-y divide-black/[0.06] dark:divide-white/[0.06]'>
              {Object.entries(profileData.notifications).map(([key, value]) => {
                const meta = NOTIF_LABELS[key] || { title: key, body: '' };
                return (
                  <div
                    key={key}
                    className='py-4 sm:py-5 flex items-center justify-between gap-6'
                  >
                    <div className='space-y-1 max-w-xl'>
                      <h4 className='text-xs sm:text-sm font-semibold text-foreground tracking-tight'>
                        {meta.title}
                      </h4>
                      <p className='text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed'>
                        {meta.body}
                      </p>
                    </div>

                    <button
                      type='button'
                      role='switch'
                      aria-checked={value}
                      onClick={() => handleNotif(key, !value)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                        value
                          ? 'bg-blue-600'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block size-3.5 rounded-full bg-white transition-transform shadow-xs',
                          value ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: DANGER ZONE */}
        {activeTab === 'danger' && (
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
                    schemes, fixed deposits, EPF/PPF records, notes, and broker
                    sync tokens. Once initiated, this action cannot be recovered
                    or undone.
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
                    Please enter your password to confirm permanent account
                    deletion:
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
                      {isDeleting && (
                        <Loader2 className='size-3.5 animate-spin' />
                      )}
                      <span>Permanently Delete Everything</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProfileView;
