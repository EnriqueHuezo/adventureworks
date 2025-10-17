'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-14 h-7" />; // Placeholder
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-muted"
      role="switch"
      aria-checked={theme === 'dark'}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        } inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-primary transition-transform`}
      >
        {theme === 'dark' ? (
          <Moon className="h-3 w-3 text-primary-foreground" />
        ) : (
          <Sun className="h-3 w-3 text-primary-foreground" />
        )}
      </span>
    </button>
  );
}

