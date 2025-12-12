'use client';

import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Standard Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
