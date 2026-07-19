'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('gym-theme');
    const next = saved === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('gym-theme', next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت تیره'}
      title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
      className="grid size-9 place-items-center rounded-xl border border-border/10 bg-surface-raised text-muted transition-colors hover:text-ink"
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

