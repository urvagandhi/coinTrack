// DEPRECATED: This hook is no longer used.
// The Zerodha dashboard has been replaced with a redirect to /portfolio.
// All portfolio data is now accessed through canonical portfolio hooks.
// This file is kept to prevent import errors — will be removed in cleanup.

export function useZerodhaDashboard() {
    return { holdings: [], mfHoldings: [], sips: [], profile: null, isLoading: false, error: null, refreshAll: () => {} };
}
