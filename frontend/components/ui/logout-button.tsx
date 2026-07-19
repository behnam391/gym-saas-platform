'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } finally {
      router.replace('/auth/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      aria-label="خروج از حساب"
      title="خروج از حساب"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-danger disabled:opacity-60"
    >
      <LogOut className="size-4" />
      {!compact && (loading ? 'در حال خروج…' : 'خروج از حساب')}
    </button>
  );
}
