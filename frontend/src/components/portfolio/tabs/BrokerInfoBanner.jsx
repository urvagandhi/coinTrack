// src/components/portfolio/tabs/BrokerInfoBanner.jsx
import { Info } from 'lucide-react';

export function BrokerInfoBanner({ message }) {
    return (
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-accent border border-border rounded-lg text-xs text-muted-foreground">
            <Info size={13} className="flex-shrink-0 text-blue-500" />
            {message}
        </div>
    );
}
