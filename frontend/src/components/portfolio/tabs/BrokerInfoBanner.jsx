import { Info } from 'lucide-react';

export function BrokerInfoBanner({ message }) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-4 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent-muted))]/30">
            <Info className="h-3.5 w-3.5 text-[hsl(var(--accent))] flex-shrink-0" strokeWidth={2} />
            <p className="text-[12px] text-foreground font-serif italic">{message}</p>
        </div>
    );
}
