// src/components/auth/AuthDivider.jsx
export function AuthDivider({ label = 'or' }) {
    return (
        <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            <span className="mx-3 text-xs text-gray-400">{label}</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
        </div>
    );
}
