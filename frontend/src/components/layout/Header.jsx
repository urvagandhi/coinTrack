'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
    const { user, logout } = useAuth();
    const [isDark, setIsDark] = useState(false); // In real app, connect to theme provider

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
            {/* Left: Breadcrumb / Title */}
            <div className="flex items-center gap-2">
                <button className="md:hidden p-2 -ml-2 text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">Home</span>
                    <ChevronRight className="w-4 h-4 mx-1" />
                    <span className="text-gray-900 dark:text-white font-semibold">My Workspace</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Broker Integration Button (Primary Action) */}
                <button className="hidden sm:flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium transition-transform active:scale-95">
                    <span>Broker Integration</span>
                    <span className="bg-white/20 dark:bg-black/10 px-1.5 py-0.5 rounded text-xs">Zerodha</span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-800">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Urva Gandhi'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'study.urva@gmail.com'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 p-0.5 cursor-pointer">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Urva'}`}
                            alt="Profile"
                            className="w-full h-full rounded-full bg-white dark:bg-black"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
