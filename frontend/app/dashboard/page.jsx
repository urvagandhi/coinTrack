'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                coinTrack Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 dark:text-gray-300">
                                {user && (
                                    <Link href="/profile">Welcome, {user.name || user.username}!</Link>
                                )}
                            </span>
                            <button
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Navigation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Zerodha Integration Card */}
                        <Link href="/zerodha" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-bold text-xl">Z</span>
                                </div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Zerodha Integration
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Link your Zerodha account to track stocks, mutual funds, and SIPs.
                            </p>
                        </Link>

                        {/* Zerodha Dashboard Card */}
                        <Link href="/zerodha/dashboard" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-xl">📊</span>
                                </div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Zerodha Dashboard
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                View your holdings, positions, and portfolio performance.
                            </p>
                        </Link>

                        {/* Profile Card */}
                        <Link href="/profile" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-green-600 font-bold text-xl">👤</span>
                                </div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Profile
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage your account settings and personal information.
                            </p>
                        </Link>
                    </div>

                    <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96">
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Dashboard Overview
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Your portfolio summary and analytics will be displayed here.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="mt-8 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                            User Information
                        </h3>
                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.username}</dd>
                                </dl>
                            </div>
                            <div>
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.name}</dd>
                                </dl>
                            </div>
                            <div>
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</dd>
                                </dl>
                            </div>
                            <div>
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.phoneNumber}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
