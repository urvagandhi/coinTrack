'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { 
    UserIcon, 
    CameraIcon, 
    PencilIcon, 
    ShieldCheckIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    BellIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
    const { user, logout } = useAuth();
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
            value: `$${profileData.totalInvestment.toLocaleString()}`,
            icon: CurrencyDollarIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            name: 'Total Profit/Loss',
            value: `+$${profileData.totalProfit.toLocaleString()}`,
            icon: ChartBarIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            name: 'Active Portfolios',
            value: profileData.portfolioCount,
            icon: ShieldCheckIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                My Profile
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => window.history.back()}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                            >
                                Back to Dashboard
                            </button>
                            <button
                                onClick={logout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                            {/* Profile Header */}
                            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 h-32">
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                            
                            {/* Profile Picture */}
                            <div className="relative px-6 pb-6">
                                <div className="flex flex-col items-center -mt-16">
                                    <div className="relative">
                                        <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full p-1 shadow-2xl">
                                            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                                                <UserIcon className="w-16 h-16 text-gray-400" />
                                            </div>
                                        </div>
                                        <button className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-200">
                                            <CameraIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="text-center mt-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {profileData.name || profileData.username}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            @{profileData.username}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                            Member since {profileData.joinDate}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="mt-6 space-y-4">
                            {stats.map((stat, index) => (
                                <div key={index} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4">
                                    <div className="flex items-center">
                                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {stat.name}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {stat.value}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Personal Information */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Personal Information
                                </h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                                            {profileData.name || 'Not provided'}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Username
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profileData.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                                            {profileData.username}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                                            {profileData.email || 'Not provided'}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Location
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profileData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                            placeholder="City, Country"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                                            {profileData.location || 'Not provided'}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bio
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => handleInputChange('bio', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                            placeholder="Tell us about yourself..."
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[80px]">
                                            {profileData.bio || 'No bio provided'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Security Settings
                                </h3>
                                <button
                                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                >
                                    <ShieldCheckIcon className="w-4 h-4" />
                                    <span>Change Password</span>
                                </button>
                            </div>

                            {showPasswordFields && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                value={passwords.currentPassword}
                                                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.current ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                value={passwords.newPassword}
                                                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.new ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                value={passwords.confirmPassword}
                                                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.confirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 pt-4">
                                        <button
                                            onClick={() => setShowPasswordFields(false)}
                                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleChangePassword}
                                            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notification Preferences */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                            <div className="flex items-center mb-6">
                                <BellIcon className="w-6 h-6 text-blue-500 mr-3" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Notification Preferences
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(profileData.notifications).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {key === 'priceAlerts' && 'Get notified when coin prices reach your target'}
                                                {key === 'portfolioUpdates' && 'Receive updates about your portfolio performance'}
                                                {key === 'marketNews' && 'Stay updated with latest cryptocurrency news'}
                                                {key === 'weeklyReports' && 'Get weekly summary of your investments'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleNotificationChange(key, !value)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    value ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}