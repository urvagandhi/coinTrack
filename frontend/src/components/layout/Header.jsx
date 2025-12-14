'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();

    const generateBreadcrumbs = () => {
        // Remove trailing slash and split
        const asPathWithoutQuery = pathname.split('?')[0];
        const asPathNestedRoutes = asPathWithoutQuery.split('/').filter(v => v.length > 0);

        // Don't show breadcrumbs on dashboard home if we consider it root
        // But user asked for "Home / My Workspace", so let's keep it consistent.

        return asPathNestedRoutes.map((subpath, idx) => {
            // Build the url for this segment
            const href = '/' + asPathNestedRoutes.slice(0, idx + 1).join('/');

            // Format the text: replace hyphens with spaces and capitalize
            const text = subpath
                .replace(/-/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase());

            const isLast = idx === asPathNestedRoutes.length - 1;

            return (
                <div key={href} className="flex items-center">
                    <ChevronRight className="w-4 h-4 mx-1" />
                    {isLast ? (
                        <span className="text-gray-900 dark:text-white font-semibold">
                            {text}
                        </span>
                    ) : (
                        <Link href={href} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                            {text}
                        </Link>
                    )}
                </div>
            );
        });
    };

    return (
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30
            bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-sm transition-colors duration-300
        ">
            {/* Left: Breadcrumb / Title */}
            <div className="flex items-center gap-2">
                <button
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={onMenuClick}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                        Home
                    </Link>
                    {generateBreadcrumbs()}
                </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Broker Integration Button (Primary Action) */}
                <button className="hidden sm:flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium transition-transform active:scale-95 shadow-lg shadow-purple-500/10 dark:shadow-purple-500/20">
                    <span>Broker Integration</span>
                    <span className="bg-white/20 dark:bg-black/10 px-1.5 py-0.5 rounded text-xs">Zerodha</span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-800">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Urva Gandhi'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'study.urva@gmail.com'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 p-0.5 cursor-pointer shadow-md">
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
