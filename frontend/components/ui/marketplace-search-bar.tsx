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
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(params.get('minRating') ?? '');
  const [gender, setGender] = useState(params.get('gender') ?? '');
  const [facility, setFacility] = useState(params.get('facilities') ?? '');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (city) next.set('city', city);
    else next.delete('city');
    if (maxPrice) next.set('maxPrice', maxPrice);
    else next.delete('maxPrice');
    if (minRating) next.set('minRating', minRating);
    else next.delete('minRating');
    if (gender) next.set('gender', gender);
    else next.delete('gender');
    if (facility) next.set('facilities', facility);
    else next.delete('facilities');
    router.push(`/?${next.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="membership-card grid w-full max-w-5xl gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto]"
    >
      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="شهر؛ مثلاً تهران" aria-label="جستجوی شهر" />
      <select
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        aria-label="حداکثر قیمت"
        className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink"
      >
        <option value="">هر بودجه‌ای</option>
        <option value="1000000">تا ۱ میلیون تومان</option>
        <option value="1500000">تا ۱.۵ میلیون تومان</option>
        <option value="3000000">تا ۳ میلیون تومان</option>
      </select>
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        aria-label="نوع پذیرش"
        className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink"
      >
        <option value="">همه باشگاه‌ها</option>
        <option value="FEMALE">ویژه بانوان</option>
        <option value="MALE">ویژه آقایان</option>
      </select>
      <select
        value={facility}
        onChange={(e) => setFacility(e.target.value)}
        aria-label="امکانات"
        className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink"
      >
        <option value="">هر امکاناتی</option>
        <option value="پارکینگ">پارکینگ</option>
        <option value="سونا">سونا</option>
        <option value="پیلاتس">پیلاتس</option>
        <option value="کراس‌فیت">کراس‌فیت</option>
      </select>
      <select
        value={minRating}
        onChange={(e) => setMinRating(e.target.value)}
        aria-label="حداقل امتیاز اعتماد"
        className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink"
      >
        <option value="">هر امتیازی</option>
        <option value="90">امتیاز ۹۰ به بالا</option>
        <option value="85">امتیاز ۸۵ به بالا</option>
      </select>
      <Button type="submit" size="md" className="sm:col-span-2 lg:col-span-1">
        <Search className="size-4" />
        جستجو
      </Button>
    </form>
  );
}
