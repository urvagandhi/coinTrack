'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/ui/feedback/use-toast';
import { emailAPI, userAPI } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Pencil,
  Save,
  ShieldAlert,
  X,
} from 'lucide-react';

export function MyProfileTab({ apiUser, refreshUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEmailVerified = Boolean(
    apiUser?.isEmailVerified ?? apiUser?.emailVerified
  );

  const isPendingEmailExpired = Boolean(
    apiUser?.pendingEmailExpiresAt &&
    new Date(apiUser.pendingEmailExpiresAt).getTime() < Date.now()
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isResendingChange, setIsResendingChange] = useState(false);
  const [isCancellingChange, setIsCancellingChange] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const cancelledRef = useRef(false);

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

  const handleChange = (f, v) => setProfileData(p => ({ ...p, [f]: v }));

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

  const displayName = profileData.name || profileData.username || 'User';

  return (
    <div className='space-y-6 sm:space-y-7'>
      {/* Header + Edit / Save Controls */}
      <div className='flex items-center justify-between gap-4 pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
            Profile Information
          </h2>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Manage your personal identity, contact details, and credentials.
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
                if (apiUser) {
                  setProfileData(prev => ({
                    ...prev,
                    name: apiUser.name || apiUser.firstName || '',
                    username: apiUser.username || '',
                    email: apiUser.email || '',
                    phoneNumber: apiUser.mobile || apiUser.phoneNumber || '',
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
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
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
                    <strong className='font-mono'>{profileData.email}</strong>{' '}
                    is not verified yet. Verification ensures account recovery
                    and security alerts.
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

          {/* Phone Number */}
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

          {/* City / Location */}
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
                  <span className='text-neutral-400 italic'>Not provided</span>
                )}
              </div>
            )}
          </div>

          {/* Bio / Tagline */}
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
    </div>
  );
}

export default MyProfileTab;
