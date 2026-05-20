// src/app/calculators/layout.jsx — Public calculator layout, no auth required
'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { useModal } from '@/contexts/ModalContext';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CalculatorsLayout({ children }) {
    const { openModal } = useModal();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-muted dark:bg-background transition-colors font-sans">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-card border-b border-border">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="w-8 h-8 relative">
                                <Image src="/coinTrack.png" alt="CoinTrack" fill sizes="32px" className="object-contain" />
                            </div>
                            <span className="text-base font-semibold text-foreground tracking-tight">CoinTrack</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <div className="hidden sm:flex items-center gap-2 border-l border-border pl-2 ml-1">
                                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
                                    Sign in
                                </Link>
                                <Link href="/register"
                                    className="text-sm font-medium bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Breadcrumb */}
            {pathname !== '/calculators' && (
                <div className="border-b border-border bg-card/50">
                    <div className="max-w-5xl mx-auto px-4">
                        <Link href="/calculators"
                            className="flex items-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft size={14} />
                            All Calculators
                        </Link>
                    </div>
                </div>
            )}

            {/* Main */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="mt-16 py-8 border-t border-border">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid gap-8 sm:grid-cols-3 mb-8">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Calculators</h3>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li><Link href="/calculators/investment/sip" className="hover:text-foreground transition-colors">SIP Calculator</Link></li>
                                <li><Link href="/calculators/loans/emi" className="hover:text-foreground transition-colors">EMI Calculator</Link></li>
                                <li><Link href="/calculators/tax/income-tax" className="hover:text-foreground transition-colors">Income Tax</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
                                <li><button onClick={() => openModal('contact')} className="hover:text-foreground transition-colors">Contact</button></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Legal</h3>
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                                <li><button onClick={() => openModal('privacy')} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
                                <li><button onClick={() => openModal('terms')} className="hover:text-foreground transition-colors">Terms of Service</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border pt-6 text-center text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} CoinTrack. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
