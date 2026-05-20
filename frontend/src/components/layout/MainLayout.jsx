'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="relative min-h-screen bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 border-r border-hairline">
                <Sidebar />
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-hairline">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Sidebar onNavigate={() => setIsMobileOpen(false)} />
                </SheetContent>
            </Sheet>

            <div className="md:pl-64 flex min-h-screen flex-col relative z-10">
                <Header onMenuClick={() => setIsMobileOpen(true)} />
                <main className="flex-1 px-4 md:px-10 lg:px-14 py-8 md:py-12 max-w-[1600px] w-full">
                    {children}
                </main>
                <footer className="px-4 md:px-10 lg:px-14 py-6 border-t border-border">
                    <div className="flex items-center justify-between text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
                        <span>© coinTrack · The Daily Ledger</span>
                        <span className="font-mono">PRINTED IN BROWSER</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
