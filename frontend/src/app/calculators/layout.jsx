'use client';

import { useModal } from '@/contexts/ModalContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Calculator, ChevronLeft, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Public layout for calculators - accessible without authentication
 */
export default function CalculatorsLayout({ children }) {

    const themeContext = useTheme();
    const { openModal } = useModal();
    const theme = themeContext?.theme || 'light';
    const toggleTheme = themeContext?.toggleTheme || (() => { });
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans selection:bg-purple-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 relative transition-transform group-hover:scale-110">
                                <Image
                                    src="/coinTrack.png"
                                    alt="coinTrack"
                                    fill
                                    sizes="32px"
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">coinTrack</span>
                        </Link>

                        {/* Center - Title */}
                        <div className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <span className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2"></span>
                            <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-medium">Financial Tools</span>
                        </div>

                        {/* Right - Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <div className="hidden sm:flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-3">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Breadcrumb Navigation - Simplified */}
            {pathname !== '/calculators' && (
                <div className="bg-white/50 dark:bg-gray-900/50 border-b border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2 py-2 text-sm">
                            <Link
                                href="/calculators"
                                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back to All Calculators
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 relative grayscale opacity-70">
                                    <Image
                                        src="/coinTrack.png"
                                        alt="coinTrack"
                                        fill
                                        sizes="24px"
                                        className="object-contain"
                                    />
                                </div>
                                <span className="font-bold text-lg text-gray-900 dark:text-white">coinTrack</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Empowering your financial journey with smart tools and analytics.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Calculators</h3>
                            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                <li><Link href="/calculators/investment/sip" className="hover:text-purple-600 dark:hover:text-purple-400">SIP Calculator</Link></li>
                                <li><Link href="/calculators/loans/emi" className="hover:text-purple-600 dark:hover:text-purple-400">EMI Calculator</Link></li>
                                <li><Link href="/calculators/tax/income-tax" className="hover:text-purple-600 dark:hover:text-purple-400">Income Tax</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
                            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                <li><Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Home</Link></li>
                                <li><Link href="/#about" className="hover:text-purple-600 dark:hover:text-purple-400">About Us</Link></li>
                                <li><button onClick={() => openModal('contact')} className="hover:text-purple-600 dark:hover:text-purple-400 text-left">Contact</button></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                <li><button onClick={() => openModal('privacy')} className="hover:text-purple-600 dark:hover:text-purple-400 text-left">Privacy Policy</button></li>
                                <li><button onClick={() => openModal('terms')} className="hover:text-purple-600 dark:hover:text-purple-400 text-left">Terms of Service</button></li>
                                <li><button onClick={() => openModal('cookies')} className="hover:text-purple-600 dark:hover:text-purple-400 text-left">Cookie Policy</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <p>© {new Date().getFullYear()} coinTrack. All rights reserved.</p>
                        <p>Made with ❤️ for smart investors</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
