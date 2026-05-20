// src/app/(access)/not-found.js
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function useNow() {
    const [now, setNow] = useState(null);
    useEffect(() => {
        setNow(new Date());
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}

export default function NotFound() {
    const now = useNow();
    const dateString = now ? now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }) : '';
    const timeString = now ? now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
    const year = now ? year : '';

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b border-hairline">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-baseline gap-3">
                        <span className="font-serif italic text-[24px] leading-none tracking-tight">coinTrack</span>
                        <span className="hidden sm:inline display-num text-[10px] text-muted-foreground">VOL.04</span>
                    </Link>
                    <p className="hidden sm:block eyebrow">Errata</p>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
                <div className="w-full max-w-3xl">
                    <div className="border-b border-hairline pb-8">
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="index-num tnum text-[11px]">[ XX ]</span>
                            <span className="eyebrow">Missing Folio</span>
                        </div>
                        <p className="font-serif text-[clamp(96px,18vw,200px)] leading-[0.85] tracking-tight text-foreground select-none">
                            404
                        </p>
                        <p className="mt-2 eyebrow">Filed under: errors, navigation, archive</p>
                    </div>

                    <div className="py-10 border-b border-hairline">
                        <h1 className="font-serif text-[36px] sm:text-[48px] leading-[1.05] tracking-tight text-foreground">
                            Page not found.
                        </h1>
                        <p className="mt-4 font-serif italic text-[17px] text-muted-foreground leading-snug max-w-xl">
                            We could not locate the page you requested. Perhaps you meant to sign in,
                            or you followed a link that has since been retired.
                        </p>
                    </div>

                    <div className="py-8 flex flex-col sm:flex-row gap-3">
                        <Link href="/login">
                            <button className="ed-btn ed-btn-primary h-11 px-6">
                                Go to Sign In
                            </button>
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="ed-btn ed-btn-ghost h-11 px-6"
                        >
                            Go Back
                        </button>
                        <Link href="/register">
                            <button className="ed-btn ed-btn-ghost h-11 px-6">
                                Create Account
                            </button>
                        </Link>
                    </div>

                    <div className="border-t border-hairline pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <p className="font-serif italic text-[13px] text-muted-foreground">
                            {dateString} · <span className="display-num text-foreground">{timeString}</span> IST
                        </p>
                        <p className="eyebrow">Reference No. 404-NF-{year}</p>
                    </div>
                </div>
            </main>

            <footer className="border-t border-hairline">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
                    <p className="eyebrow">&copy; {year} CoinTrack — Printed in Browser</p>
                </div>
            </footer>
        </div>
    );
}
