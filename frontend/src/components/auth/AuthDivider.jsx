// src/components/auth/AuthDivider.jsx
export function AuthDivider({ label = 'or' }) {
    return (
        <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-hairline" />
            <span className="mx-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
                {label}
            </span>
            <div className="flex-grow border-t border-hairline" />
        </div>
    );
}
