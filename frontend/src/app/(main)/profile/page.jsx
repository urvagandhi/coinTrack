'use client';

import PageTransition from '@/components/ui/PageTransition';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { emailAPI, portfolioAPI, twofaAPI, userAPI } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Bell, Camera, DollarSign, Edit, Eye, EyeOff, Key, Loader2, Save, Shield, ShieldAlert, TrendingUp, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const { user, login, resetTotp, verifyResetTotp } = useAuth(); // getting login to update context if needed
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch user profile from API to ensure authoritative state
    const { data: apiUser, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: userAPI.getProfile,
        initialData: user, // Hydrate from AuthContext instantly
        staleTime: 1000 * 60 * 5, // 5 minutes stale time
    });

    // Fetch portfolio summary for stats
    const { data: portfolioSummary } = useQuery({
        queryKey: ['portfolioSummary'],
        queryFn: portfolioAPI.getSummary,
        staleTime: 1000 * 60 * 5,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [show2FAResetFlow, setShow2FAResetFlow] = useState(false);
    const [twoFAStep, setTwoFAStep] = useState('verify'); // 'verify', 'newcode', 'backup'
    const [currentTotpCode, setCurrentTotpCode] = useState('');
    const [useBackupForReset, setUseBackupForReset] = useState(false); // Toggle between TOTP and backup code
    const [newTotpCode, setNewTotpCode] = useState('');
    const [newBackupCodes, setNewBackupCodes] = useState([]);
    const [resetSetupData, setResetSetupData] = useState(null);
    const [is2FALoading, setIs2FALoading] = useState(false);
    const [isSendingRecovery, setIsSendingRecovery] = useState(false);
    const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);

    // Form state - initialized from apiUser
    const [profileData, setProfileData] = useState({
        name: apiUser?.name || '',
        username: apiUser?.username || '',
        email: apiUser?.email || '',
        bio: apiUser?.bio || '',
        location: apiUser?.location || '',
        phoneNumber: apiUser?.mobile || apiUser?.phoneNumber || '',
        // These are static for now as per original mock, backend could provide them later
        joinDate: apiUser?.createdAt ? new Date(apiUser.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        totalInvestment: 15420.50,
        totalProfit: 2840.75,
        portfolioCount: 12,
        notifications: {
            priceAlerts: true,
            portfolioUpdates: true,
            marketNews: false,
            weeklyReports: true
        }
    });

    // Update form when apiUser loads/changes
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
                joinDate: apiUser.createdAt ? new Date(apiUser.createdAt).toLocaleDateString() : prev.joinDate,
            }));
        }
    }, [apiUser]);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNotificationChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [field]: value
            }
        }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswords(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Profile Update Mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data) => userAPI.updateProfile(user.userId || user.id, data),
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(['profile'], updatedUser);
            toast({
                title: "Profile Updated",
                description: "Your profile details have been saved successfully.",
                variant: "success",
            });
            setIsEditing(false);
        },
        onError: (error) => {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        }
    });

    // Password Change Mutation
    const changePasswordMutation = useMutation({
        mutationFn: (data) => userAPI.changePassword(user.userId || user.id, data.newPassword, data.currentPassword),
        onSuccess: () => {
            toast({
                title: "Password Changed",
                description: "Your password has been updated securely.",
                variant: "success",
            });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordFields(false);
        },
        onError: (error) => {
            toast({
                title: "Change Password Failed",
                description: error.message || "Failed to change password",
                variant: "destructive",
            });
        }
    });

    const handleSaveProfile = async () => {
        // ══════════════════════════════════════════════════════════════════════
        // VALIDATION
        // ══════════════════════════════════════════════════════════════════════

        // Email is mandatory and must be valid format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!profileData.email || profileData.email.trim() === '') {
            toast({ title: "Validation Error", description: "Email is required", variant: "destructive" });
            return;
        }
        if (!emailRegex.test(profileData.email)) {
            toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" });
            return;
        }

        // Mobile: if provided, must be exactly 10 digits
        // Strip +91 prefix first, then remove non-digits
        let cleanedMobile = profileData.phoneNumber || '';
        cleanedMobile = cleanedMobile.replace(/^\+91/, '').replace(/\D/g, '');

        // Take only last 10 digits if somehow we have more
        if (cleanedMobile.length > 10) {
            cleanedMobile = cleanedMobile.slice(-10);
        }

        if (cleanedMobile && cleanedMobile.length !== 10) {
            toast({ title: "Validation Error", description: "Mobile number must be exactly 10 digits", variant: "destructive" });
            return;
        }
        if (cleanedMobile && !/^[6-9]\d{9}$/.test(cleanedMobile)) {
            toast({ title: "Validation Error", description: "Please enter a valid Indian mobile number", variant: "destructive" });
            return;
        }

        // ══════════════════════════════════════════════════════════════════════
        // CHECK FOR EMAIL CHANGE
        // ══════════════════════════════════════════════════════════════════════
        const originalEmail = (apiUser?.email || '').toLowerCase().trim();
        const newEmail = profileData.email.trim().toLowerCase();
        const emailChanged = newEmail !== originalEmail;

        // If email changed, use the secure email change flow
        if (emailChanged) {
            try {
                await emailAPI.change(newEmail);
                toast({
                    title: "Verification Email Sent",
                    description: "A verification link has been sent to your new email address. Please click it to complete the change.",
                    variant: "success",
                });
            } catch (error) {
                toast({
                    title: "Email Change Failed",
                    description: error.message || "Failed to initiate email change",
                    variant: "destructive",
                });
                return;
            }
        }

        // Update other profile fields (excluding email - that's handled above)
        updateProfileMutation.mutate({
            name: profileData.name,
            bio: profileData.bio,
            location: profileData.location,
            phoneNumber: cleanedMobile || null // Send only digits, backend will add +91
        });
    };

    const handleChangePassword = async () => {
        if (!passwords.currentPassword) {
            toast({ title: "Validation Error", description: "Current password is required", variant: "destructive" });
            return;
        }
        if (passwords.newPassword.length < 8) {
            toast({ title: "Validation Error", description: "New password must be at least 8 characters", variant: "destructive" });
            return;
        }
        if (passwords.currentPassword === passwords.newPassword) {
            toast({ title: "Validation Error", description: "New password cannot be the same as the current password", variant: "destructive" });
            return;
        }
        if (!/[A-Z]/.test(passwords.newPassword) || !/[0-9]/.test(passwords.newPassword)) {
            toast({ title: "Validation Error", description: "Password must contain at least one uppercase letter and one number", variant: "destructive" });
            return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast({ title: "Validation Error", description: "New passwords do not match!", variant: "destructive" });
            return;
        }

        changePasswordMutation.mutate({
            newPassword: passwords.newPassword,
            currentPassword: passwords.currentPassword
        });
    };

    // 2FA Reset Flow
    const handleInitiate2FAReset = async () => {
        const codeLength = useBackupForReset ? 8 : 6;
        if (!currentTotpCode || currentTotpCode.length !== codeLength) {
            toast({ title: "Validation Error", description: `Please enter your ${useBackupForReset ? '8-digit backup' : '6-digit authenticator'} code`, variant: "destructive" });
            return;
        }
        setIs2FALoading(true);
        try {
            // Use the same resetTotp function - backend should accept both TOTP and backup codes
            const result = await resetTotp(currentTotpCode);
            if (result.success) {
                setResetSetupData(result.data);
                setTwoFAStep('newcode');
                setCurrentTotpCode('');
            } else {
                toast({ title: "Reset Failed", description: result.error || "Invalid code", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to initiate 2FA reset", variant: "destructive" });
        } finally {
            setIs2FALoading(false);
        }
    };

    const handleVerifyNew2FA = async () => {
        if (!newTotpCode || newTotpCode.length !== 6) {
            toast({ title: "Validation Error", description: "Please enter the new 6-digit code", variant: "destructive" });
            return;
        }
        setIs2FALoading(true);
        try {
            const result = await verifyResetTotp(newTotpCode);
            if (result.success) {
                setNewBackupCodes(result.backupCodes || []);
                setTwoFAStep('backup');
                setNewTotpCode('');
                toast({ title: "2FA Reset Complete", description: "Your authenticator has been reset. Save your new backup codes!", variant: "success" });
            } else {
                toast({ title: "Verification Failed", description: result.error || "Invalid code", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to verify new 2FA code", variant: "destructive" });
        } finally {
            setIs2FALoading(false);
        }
    };

    const downloadNewBackupCodes = () => {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const content = `
+-----------------------------------------------------------------------+
|                                                                       |
|                     COINTRACK BACKUP CODES                            |
|                                                                       |
+-----------------------------------------------------------------------+

  [!] IMPORTANT: STORE THESE CODES SECURELY

      * Each code can only be used ONCE
      * Keep these codes in a safe place (password manager, safe)
      * Do NOT share these codes with anyone
      * If codes are compromised, reset your 2FA immediately

=======================================================================
                         YOUR BACKUP CODES
=======================================================================

${newBackupCodes.map((code, i) => `        [ ${String(i + 1).padStart(2, '0')} ]    ${code}`).join('\n')}

=======================================================================

    Generated: ${formattedDate}
    Total Codes: ${newBackupCodes.length}

=======================================================================
                      HOW TO USE BACKUP CODES
=======================================================================

    1. Go to the CoinTrack login page
    2. Enter your username and password
    3. When prompted for 2FA code, click "Use Backup Code"
    4. Enter one of your backup codes from this list
    5. Cross off the used code - it cannot be used again!

+-----------------------------------------------------------------------+
|                 CoinTrack - Your Portfolio, Secured                   |
+-----------------------------------------------------------------------+
`.trim();
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `coinTrack_backup-codes_${apiUser?.username || 'user'}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
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

    const stats = [
        {
            name: 'Total Investment',
            value: portfolioSummary?.totalInvestedValue ? `₹${portfolioSummary.totalInvestedValue.toLocaleString('en-IN')}` : '₹0',
            icon: DollarSign,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        },
        {
            name: 'Total Profit/Loss',
            value: portfolioSummary?.totalUnrealizedPL ? `${portfolioSummary.totalUnrealizedPL >= 0 ? '+' : ''}₹${portfolioSummary.totalUnrealizedPL.toLocaleString('en-IN')}` : '₹0',
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/20'
        },
        {
            name: 'Active Holdings',
            value: portfolioSummary?.holdingsList?.length || 0,
            icon: Shield,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20'
        }
    ];

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <span className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
                        <User className="w-6 h-6" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account information and preferences.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Profile Card & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-orange-400 to-pink-500">
                                        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.name || 'User'}`}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="text-center mt-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {profileData.name || profileData.username}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        @{profileData.username}
                                    </p>
                                    <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Member since {profileData.joinDate}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="space-y-4">
                            {stats.map((stat, index) => (
                                <div key={index} className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
                                    <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {stat.name}
                                        </p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                                            {stat.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Personal Information */}
                        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Personal Information
                                </h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                >
                                    {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                    <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Full Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white font-medium border border-transparent truncate">
                                            {profileData.name || <span className="text-gray-400 italic">Not provided</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Username (Read-only) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Username
                                    </label>
                                    <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white font-medium border border-transparent truncate">
                                        {profileData.username || <span className="text-gray-400 italic">Not provided</span>}
                                    </div>
                                </div>

                                {/* Email (Mandatory) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        Email <span className="text-red-500">*</span>
                                        {apiUser?.isEmailVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium normal-case">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                                Verified
                                            </span>
                                        )}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
                                            placeholder="name@example.com"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white font-medium border border-transparent truncate flex items-center gap-2">
                                            {profileData.email || <span className="text-gray-400 italic">Not provided</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Mobile with +91 prefix */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Mobile
                                    </label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                                +91
                                            </span>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={profileData.phoneNumber?.replace(/^\+91/, '').replace(/\D/g, '') || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    handleInputChange('phoneNumber', val);
                                                }}
                                                className="w-full pl-14 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
                                                placeholder="9876543210"
                                            />
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white font-medium border border-transparent truncate">
                                            {profileData.phoneNumber ? `+91 ${profileData.phoneNumber.replace(/^\+91/, '')}` : <span className="text-gray-400 italic">Not provided</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Location
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profileData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            placeholder="City, Country"
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white font-medium border border-transparent truncate">
                                            {profileData.location || <span className="text-gray-400 italic">Not provided</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Bio - Full width */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Bio
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-white transition-all resize-none"
                                            placeholder="Tell us about yourself..."
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white font-medium min-h-[80px]">
                                            {profileData.bio || <span className="text-gray-400 italic">No bio provided</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={updateProfileMutation.isPending}
                                        className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {updateProfileMutation.isPending ? 'Saving...' : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Security Settings
                                </h3>
                                <div className="grid grid-cols-2 sm:flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowPasswordFields(!showPasswordFields);
                                            if (!showPasswordFields) setShow2FAResetFlow(false);
                                        }}
                                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span className="whitespace-nowrap">Change Password</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShow2FAResetFlow(!show2FAResetFlow);
                                            if (!show2FAResetFlow) setShowPasswordFields(false);
                                        }}
                                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs sm:text-sm font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                                    >
                                        <Key className="w-4 h-4" />
                                        <span className="whitespace-nowrap">Reset 2FA</span>
                                    </button>
                                </div>
                            </div>

                            {showPasswordFields && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {[
                                        { label: 'Current Password', field: 'currentPassword', type: 'current' },
                                        { label: 'New Password', field: 'newPassword', type: 'new' },
                                        { label: 'Confirm New Password', field: 'confirmPassword', type: 'confirm' },
                                    ].map((item) => (
                                        <div key={item.field}>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                {item.label}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords[item.type] ? "text" : "password"}
                                                    value={passwords[item.field]}
                                                    onChange={(e) => handlePasswordChange(item.field, e.target.value)}
                                                    className="w-full px-4 py-3 pr-12 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-gray-900 dark:text-white transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility(item.type)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                >
                                                    {showPasswords[item.type] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-end gap-4 pt-4">
                                        <button
                                            onClick={() => setShowPasswordFields(false)}
                                            className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={changePasswordMutation.isPending}
                                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                        >
                                            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 2FA Reset Flow */}
                            {show2FAResetFlow && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-gray-100 dark:border-gray-800 pt-6 mt-4">
                                    {twoFAStep === 'verify' && (
                                        <>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {useBackupForReset
                                                    ? "Enter one of your backup codes to verify your identity and reset 2FA."
                                                    : "To reset your 2FA, first verify your identity with your current authenticator code."}
                                            </p>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                    {useBackupForReset ? 'Backup Code' : 'Current 2FA Code'}
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={useBackupForReset ? 8 : 6}
                                                    value={currentTotpCode}
                                                    onChange={(e) => setCurrentTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                    className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-gray-900 dark:text-white transition-all text-center text-lg tracking-widest font-mono"
                                                    placeholder={useBackupForReset ? "00000000" : "000000"}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUseBackupForReset(!useBackupForReset);
                                                        setCurrentTotpCode('');
                                                    }}
                                                    className="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 transition-colors"
                                                >
                                                    {useBackupForReset ? '← Use Authenticator Code' : 'Lost your device? Use Backup Code →'}
                                                </button>

                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    {!showRecoveryConfirm ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowRecoveryConfirm(true)}
                                                            className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 transition-colors flex items-center justify-center gap-2 mx-auto"
                                                        >
                                                            <ShieldAlert className="w-4 h-4" />
                                                            Lost everything? Request Recovery Link
                                                        </button>
                                                    ) : (
                                                        <div className="text-center bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                                            <p className="text-sm text-red-800 dark:text-red-300 mb-3 font-medium">
                                                                Send recovery link to {user.email}? <br />
                                                                <span className="text-xs font-normal opacity-80">Existing 2FA will be disabled.</span>
                                                            </p>
                                                            <div className="flex justify-center gap-3">
                                                                <button
                                                                    onClick={() => setShowRecoveryConfirm(false)}
                                                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        setIsSendingRecovery(true);
                                                                        try {
                                                                            await twofaAPI.requestRecovery(user.email);
                                                                            toast({ title: "Recovery Link Sent", description: "Check your email to disable 2FA.", variant: "success" });
                                                                            close2FAFlow();
                                                                            setShowRecoveryConfirm(false);
                                                                        } catch (error) {
                                                                            toast({ title: "Error", description: error.message || "Failed to send recovery link", variant: "destructive" });
                                                                        } finally {
                                                                            setIsSendingRecovery(false);
                                                                        }
                                                                    }}
                                                                    disabled={isSendingRecovery}
                                                                    className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                                                                >
                                                                    {isSendingRecovery ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Send It'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-4 pt-2">
                                                <button onClick={close2FAFlow} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                                                <button onClick={handleInitiate2FAReset} disabled={is2FALoading || currentTotpCode.length !== (useBackupForReset ? 8 : 6)} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                                                    {is2FALoading ? 'Verifying...' : 'Continue'}
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {twoFAStep === 'newcode' && resetSetupData && (
                                        <>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Scan this QR code with your authenticator app, then enter the new code.</p>
                                            {resetSetupData.qrCodeBase64 && (
                                                <div className="flex justify-center bg-white p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <img src={resetSetupData.qrCodeBase64} alt="QR Code" className="w-40 h-40" />
                                                </div>
                                            )}
                                            {resetSetupData.secret && (
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Or enter manually:</p>
                                                    <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 inline-block">{resetSetupData.secret}</code>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">New 2FA Code</label>
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={newTotpCode}
                                                    onChange={(e) => setNewTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                    className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-gray-900 dark:text-white transition-all text-center text-lg tracking-widest font-mono"
                                                    placeholder="000000"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-4 pt-2">
                                                <button onClick={close2FAFlow} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                                                <button onClick={handleVerifyNew2FA} disabled={is2FALoading || newTotpCode.length !== 6} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                                                    {is2FALoading ? 'Verifying...' : 'Verify & Complete'}
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {twoFAStep === 'backup' && (
                                        <>
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                                <p className="text-green-800 dark:text-green-300 font-semibold">✓ 2FA Reset Complete!</p>
                                                <p className="text-green-700 dark:text-green-400 text-sm mt-1">Save your new backup codes below. You won&apos;t see them again!</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {newBackupCodes.map((code, i) => (
                                                    <div key={i} className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-center font-mono text-sm">{code}</div>
                                                ))}
                                            </div>
                                            <div className="flex justify-end gap-4 pt-2">
                                                <button onClick={downloadNewBackupCodes} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">Download Codes</button>
                                                <button onClick={close2FAFlow} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">Done</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Notification Preferences */}
                        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Notification Preferences
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(profileData.notifications).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {key === 'priceAlerts' && 'Get notified when coin prices reach your target'}
                                                {key === 'portfolioUpdates' && 'Receive updates about your portfolio performance'}
                                                {key === 'marketNews' && 'Stay updated with latest cryptocurrency news'}
                                                {key === 'weeklyReports' && 'Get weekly summary of your investments'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleNotificationChange(key, !value)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition >
    );
}
