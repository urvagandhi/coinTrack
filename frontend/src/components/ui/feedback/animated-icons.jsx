import { cn } from '@/lib/utils';

export function AnimatedSuccessIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <path
        d='M22 11.08V12a10 10 0 1 1-5.93-9.14'
        className='animate-[draw-circle_0.8s_ease-in-out_forwards]'
        strokeDasharray='100'
        strokeDashoffset='100'
      />
      <path
        d='M9 11.01L12 14.01L22 4'
        className='animate-[draw-check_0.5s_ease-out_0.6s_forwards]'
        strokeDasharray='50'
        strokeDashoffset='50'
      />
    </svg>
  );
}

export function AnimatedWarningIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <path
        d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'
        className='animate-[draw-triangle_0.8s_ease-in-out_forwards]'
        strokeDasharray='120'
        strokeDashoffset='120'
      />
      <path
        d='M12 9v4'
        className='animate-[draw-line_0.3s_ease-out_0.6s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
      <path
        d='M12 17h.01'
        className='animate-[draw-dot_0.2s_ease-out_0.9s_forwards]'
        strokeDasharray='2'
        strokeDashoffset='2'
      />
    </svg>
  );
}

export function AnimatedInfoIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <path
        d='M2 22l1.9-5.9A9 9 0 1 1 7.9 20L2 22z'
        className='animate-[draw-circle_0.8s_ease-in-out_forwards]'
        strokeDasharray='100'
        strokeDashoffset='100'
      />
      <path
        d='M12 8h.01'
        className='animate-[draw-dot_0.2s_ease-out_0.6s_forwards]'
        strokeDasharray='2'
        strokeDashoffset='2'
      />
      <path
        d='M12 12v4'
        className='animate-[draw-line_0.3s_ease-out_0.8s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
    </svg>
  );
}

export function AnimatedErrorIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <circle
        cx='12'
        cy='12'
        r='10'
        className='animate-[draw-circle_0.8s_ease-in-out_forwards]'
        strokeDasharray='100'
        strokeDashoffset='100'
      />
      <path
        d='m15 9-6 6'
        className='animate-[draw-line_0.3s_ease-out_0.6s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
      <path
        d='m9 9 6 6'
        className='animate-[draw-line_0.3s_ease-out_0.8s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
    </svg>
  );
}

export function AnimatedTerminalIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <polyline
        points='4 17 10 11 4 5'
        className='animate-[draw-arrow_0.5s_ease-in-out_forwards]'
        strokeDasharray='20'
        strokeDashoffset='20'
      />
      <line
        x1='12'
        x2='20'
        y1='19'
        y2='19'
        className='animate-[draw-line_0.3s_ease-out_0.4s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
    </svg>
  );
}

export function AnimatedTrashIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <path
        d='M3 6h18'
        className='animate-[draw-line_0.3s_ease-out_forwards]'
        strokeDasharray='24'
        strokeDashoffset='24'
      />
      <path
        d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'
        className='animate-[draw-circle_0.6s_ease-in-out_0.2s_forwards]'
        strokeDasharray='60'
        strokeDashoffset='60'
      />
      <path
        d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'
        className='animate-[draw-line_0.4s_ease-out_0.5s_forwards]'
        strokeDasharray='20'
        strokeDashoffset='20'
      />
      <line
        x1='10'
        x2='10'
        y1='11'
        y2='17'
        className='animate-[draw-line_0.3s_ease-out_0.7s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
      <line
        x1='14'
        x2='14'
        y1='11'
        y2='17'
        className='animate-[draw-line_0.3s_ease-out_0.8s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
    </svg>
  );
}

export function AnimatedSettingsIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-300 group-hover/button:rotate-45',
        className
      )}
      {...props}
    >
      <circle
        cx='12'
        cy='12'
        r='3'
        className='animate-[draw-circle_0.5s_ease-in-out_forwards]'
        strokeDasharray='25'
        strokeDashoffset='25'
      />
      <path
        d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
        className='animate-[draw-triangle_0.8s_ease-in-out_0.3s_forwards]'
        strokeDasharray='140'
        strokeDashoffset='140'
      />
    </svg>
  );
}

export function AnimatedSparklesIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <path
        d='m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z'
        className='animate-[draw-triangle_0.8s_ease-in-out_forwards]'
        strokeDasharray='80'
        strokeDashoffset='80'
      />
      <path
        d='M5 3v4'
        className='animate-[draw-line_0.3s_ease-out_0.5s_forwards]'
        strokeDasharray='6'
        strokeDashoffset='6'
      />
      <path
        d='M19 17v4'
        className='animate-[draw-line_0.3s_ease-out_0.6s_forwards]'
        strokeDasharray='6'
        strokeDashoffset='6'
      />
    </svg>
  );
}

export function AnimatedPlusIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-300 group-hover/button:rotate-90 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <path
        d='M5 12h14'
        className='animate-[draw-line_0.3s_ease-out_forwards]'
        strokeDasharray='14'
        strokeDashoffset='14'
      />
      <path
        d='M12 5v14'
        className='animate-[draw-line_0.3s_ease-out_0.15s_forwards]'
        strokeDasharray='14'
        strokeDashoffset='14'
      />
    </svg>
  );
}

export function AnimatedBellIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible origin-top transition-transform duration-300 group-hover/button:rotate-12 group-hover/button:scale-110',
        className
      )}
      {...props}
    >
      <path
        d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'
        className='animate-[draw-triangle_0.7s_ease-in-out_forwards]'
        strokeDasharray='100'
        strokeDashoffset='100'
      />
      <path
        d='M10.3 21a1.94 1.94 0 0 0 3.4 0'
        className='animate-[draw-line_0.3s_ease-out_0.4s_forwards]'
        strokeDasharray='10'
        strokeDashoffset='10'
      />
    </svg>
  );
}

export function AnimatedDownloadIcon({ className, ...props }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn(
        'overflow-visible transition-transform duration-200 group-hover/button:translate-y-0.5 group-hover/button:scale-105',
        className
      )}
      {...props}
    >
      <path
        d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'
        className='animate-[draw-triangle_0.6s_ease-in-out_forwards]'
        strokeDasharray='50'
        strokeDashoffset='50'
      />
      <path
        d='M12 3v12'
        className='animate-[draw-line_0.3s_ease-out_0.3s_forwards]'
        strokeDasharray='12'
        strokeDashoffset='12'
      />
      <polyline
        points='7 10 12 15 17 10'
        className='animate-[draw-arrow_0.4s_ease-out_0.5s_forwards]'
        strokeDasharray='20'
        strokeDashoffset='20'
      />
    </svg>
  );
}
