'use client';

import PageTransition from '@/components/ui/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Camera from 'lucide-react/dist/esm/icons/camera';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Save from 'lucide-react/dist/esm/icons/save';
import Shield from 'lucide-react/dist/esm/icons/shield';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import User from 'lucide-react/dist/esm/icons/user';
import X from 'lucide-react/dist/esm/icons/x';
import { useState } from 'react';

export default function ProfilePage() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        bio: '',
        location: '',
        joinDate: new Date().toLocaleDateString(),
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

    const handleSaveProfile = async () => {
        // TODO: Implement API call to update profile
        console.log('Saving profile:', profileData);
        setIsEditing(false);
    };

    const handleChangePassword = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            alert('New passwords do not match!');
            return;
        }
        // TODO: Implement API call to change password
        console.log('Changing password');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordFields(false);
    };

    const stats = [
        {
            name: 'Total Investment',
            value: `₹${profileData.totalInvestment.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        },
        {
            name: 'Total Profit/Loss',
            value: `+₹${profileData.totalProfit.toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/20'
        },
        {
            name: 'Active Portfolios',
            value: profileData.portfolioCount,
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
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.name || 'Urva'}`}
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
                                {[
                                    { label: 'Full Name', field: 'name', type: 'text' },
                                    { label: 'Username', field: 'username', type: 'text' },
                                    { label: 'Email', field: 'email', type: 'email' },
                                    { label: 'Location', field: 'location', type: 'text', placeholder: 'City, Country' },
                                ].map((item) => (
                                    <div key={item.field}>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                            {item.label}
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type={item.type}
                                                value={profileData[item.field]}
                                                onChange={(e) => handleInputChange(item.field, e.target.value)}
                                                placeholder={item.placeholder}
                                                className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
                                            />
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/5 rounded-xl text-gray-900 dark:text-white font-medium border border-transparent">
                                                {profileData[item.field] || <span className="text-gray-400 italic">Not provided</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}

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
                                        className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Security Settings
                                </h3>
                                <button
                                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                >
                                    <Shield className="w-4 h-4" />
                                    <span>Change Password</span>
                                </button>
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
                                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            Update Password
                                        </button>
                                    </div>
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
        </PageTransition>
    );
}
