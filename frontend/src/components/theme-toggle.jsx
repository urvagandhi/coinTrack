'use client';

import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                aria-label="Theme toggle"
                className="text-muted-foreground hover:text-foreground"
            >
                <Sun className="h-[1.15rem] w-[1.15rem]" />
            </Button>
        );
    }

    const isDark = resolvedTheme === 'dark';
    const Icon = isDark ? Moon : Sun;
    const next = isDark ? 'light' : 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(next)}
            aria-label={`Switch to ${next} theme`}
            className="text-muted-foreground hover:text-foreground"
        >
            <Icon className="h-[1.15rem] w-[1.15rem]" />
        </Button>
    );
}
