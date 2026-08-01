import { AlertCircle } from 'lucide-react';

export default function DataAccuracyWarning({ className = "" }) {
    return (
        <div className={`flex items-start gap-3 px-4 py-3 border-l-2 border-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/5 ${className}`}>
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[13px] text-foreground font-medium">
                Note: Automated data fetching for NAV, units, or other values may occasionally reflect discrepancies or delayed prices. We apologize for any inconvenience. Please verify your entries carefully and correct them manually if needed.
            </p>
        </div>
    );
}
