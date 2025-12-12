'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-300 relative">
            {/* Background Orbs (Global for Main Layout) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            {/* Sidebar with Mobile Props */}
            <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
                    {children}
                </main>
            </div>
        </div>
    );
}
