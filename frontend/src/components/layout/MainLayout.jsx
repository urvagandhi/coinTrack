'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

const publicRoutes = ['/login', '/register', '/forgot-password', '/', '/calculator'];

export default function MainLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );

    // Handle responsive behavior
    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 1024; // lg breakpoint
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(false); // Close mobile sidebar on desktop
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [pathname, isMobile]);

    // For public routes or unauthenticated users, render children without layout
    if (!isAuthenticated || isPublicRoute) {
        return (
            <div className="min-h-screen bg-cointrack-bg-light dark:bg-cointrack-bg-dark">
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cointrack-bg-light dark:bg-cointrack-bg-dark">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isMobile={isMobile}
            />

            {/* Main content */}
            <div className={`transition-all duration-300 ${isMobile ? 'lg:ml-64' : 'ml-64'}`}>
                {/* Header */}
                <Header
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    isMobile={isMobile}
                />

                {/* Page content */}
                <main className="px-4 py-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-cointrack-light/20 dark:border-cointrack-dark/20 bg-white/50 dark:bg-cointrack-dark-card/50 backdrop-blur-sm">
                    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-cointrack-dark/70 dark:text-cointrack-light/70">
                                    © {new Date().getFullYear()}
                                </span>
                                <span className="bg-gradient-to-r from-cointrack-primary to-cointrack-secondary bg-clip-text text-sm font-bold text-transparent">
                                    CoinTrack
                                </span>
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-cointrack-dark/50 dark:text-cointrack-light/50">
                                    Made with ❤️ for smart investors • Track smarter, invest better
                                </p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <a
                                    href="https://github.com/urvagandhi"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 text-sm text-cointrack-dark/60 hover:text-cointrack-primary dark:text-cointrack-light/60 dark:hover:text-cointrack-primary transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <span>GitHub</span>
                                </a>

                                <a
                                    href="mailto:support@cointrack.com"
                                    className="flex items-center space-x-1 text-sm text-cointrack-dark/60 hover:text-cointrack-secondary dark:text-cointrack-light/60 dark:hover:text-cointrack-secondary transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>Contact</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}