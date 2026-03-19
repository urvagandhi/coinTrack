// src/components/dashboard/StatsCard.jsx
// Not used directly anymore — PortfolioSummary renders cards inline.
// Kept for potential reuse elsewhere.
'use client';

export function StatsCard({ children }) {
    return (
        <div className="bg-card/40 border border-border/50 p-5 rounded-xl backdrop-blur-md shadow-sm">
            {children}
        </div>
    );
}
