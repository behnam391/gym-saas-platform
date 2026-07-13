'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

export function MarketplaceSearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [city, setCity] = useState(params.get('city') ?? '');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (city) next.set('city', city);
    else next.delete('city');
    router.push(`/?${next.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-2">
      <Input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="نام شهر را وارد کنید… مثلاً تهران"
        className="flex-1"
        aria-label="جستجوی شهر"
      />
      <Button type="submit" size="md">
        <Search className="size-4" />
        جستجو
      </Button>
    </form>
  );
}
