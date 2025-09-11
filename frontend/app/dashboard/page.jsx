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
                    <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96">
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Dashboard Content Coming Soon
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Your cryptocurrency tracking features will be implemented here.
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
