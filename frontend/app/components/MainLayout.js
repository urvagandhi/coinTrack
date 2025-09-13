'use client';
import React from 'react';

import { Sidebar } from '../components/Sidebar';
import { usePathname } from 'next/navigation';
import { User } from "lucide-react";

export default function MainLayout({ children }) {
    const pathname = usePathname();

    // Pages that should not show the sidebar (login, register, etc.)
    const authPages = ['/login', '/register', '/forgot-password'];
    const shouldShowSidebar = !authPages.some(page => pathname.startsWith(page));

    if (!shouldShowSidebar) {
        return <>{children}</>;
    }

    // Sidebar collapse state
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar with collapse prop */}
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <nav className="flex items-center justify-between px-8 py-3 bg-white border-b border-gray-200 min-h-[56px]">
                    {/* Left: Collapse Button + Logo */}
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center mr-2 hover:bg-gray-100"
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            style={{ transition: 'box-shadow 0.2s' }}
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="4" y="7" width="16" height="2" rx="1" fill="currentColor" />
                                <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
                                <rect x="4" y="15" width="16" height="2" rx="1" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                    {/* Center: Page Title (optional, can be dynamic) */}
                    {/* <div className="text-lg font-semibold text-gray-700">Dashboard</div> */}
                    {/* Right: Controls */}
                    <div className="flex items-center space-x-3">
                        {/* Profile Avatar */}
                        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            <User className="w-5 h-5" />
                            <span href="/profile" alt="Profile" className="w-8 h-8 object-cover" />
                        </button>
                    </div>
                </nav>
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="h-full px-8 pt-6 pb-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}