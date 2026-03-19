'use client';

import { overlayVariants, pageVariants, useMotionVariants } from '@/lib/motion';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const pathname = usePathname();
    const variants = useMotionVariants(pageVariants);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-black transition-colors duration-300 relative">
            {/* Background Orbs (Global for Main Layout) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            {/* Desktop sidebar — always visible, hover to expand */}
            <div className="hidden md:flex flex-shrink-0 relative z-10">
                <Sidebar />
            </div>

            {/* Mobile sidebar drawer */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <>
                        <motion.div
                            variants={overlayVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed inset-y-0 left-0 z-50 w-[280px] md:hidden"
                        >
                            <Sidebar
                                isMobile
                                onClose={() => setIsMobileSidebarOpen(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main content area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            variants={variants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
