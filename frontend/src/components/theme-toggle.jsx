'use client';

import { Button } from '@/components/ui/button';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const ORDER = ['light', 'dark', 'system'];

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const current = mounted ? (theme ?? 'system') : 'system';
    const Icon = current === 'dark' ? Moon : current === 'system' ? Monitor : Sun;

    const cycle = () => {
        const idx = ORDER.indexOf(current);
        setTheme(ORDER[(idx + 1) % ORDER.length]);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={cycle}
            aria-label={`Theme: ${current}. Click to switch.`}
            className="text-muted-foreground hover:text-foreground"
        >
            <Icon className="h-[1.15rem] w-[1.15rem]" />
        </Button>
    );
}
