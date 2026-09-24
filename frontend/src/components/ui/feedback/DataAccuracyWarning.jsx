import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export default function DataAccuracyWarning({ className = '' }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-l-2 border-amber-500/80 bg-amber-500/10 dark:bg-amber-500/5 rounded-r-md text-foreground',
        className
      )}
    >
      <AlertCircle
        className='h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5'
        strokeWidth={2}
      />
      <p className='text-xs leading-relaxed font-medium text-foreground/90'>
        Note: Automated data fetching for NAV, market rates, or prices may
        occasionally reflect upstream exchange delays. Please verify your
        entries carefully and manually update if needed.
      </p>
    </div>
  );
}
