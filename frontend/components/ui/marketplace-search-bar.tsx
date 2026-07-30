'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from './button';
import { IRAN_LOCATIONS, IRAN_PROVINCES } from '../../lib/iran-locations';
import { api } from '../../lib/api';

interface LocatedAddress {
  city: string | null;
  province: string | null;
  county: string | null;
}

interface CachedLocation {
  province: string;
  city: string;
  latitude: number;
  longitude: number;
  expiresAt: number;
}

const LOCATION_CACHE_KEY = 'gordyar-market-location';
const LOCATION_DENIED_KEY = 'gordyar-market-location-denied';

function normalizeLocationName(value: string) {
  return value
    .replace(/^(استان|شهرستان)\s+/, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCanonicalLocation(value: string, options: string[]) {
  const normalized = normalizeLocationName(value);
  return (
    options.find(
      (option) => normalizeLocationName(option) === normalized,
    ) ?? value
  );
}

export function MarketplaceSearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [province, setProvince] = useState(params.get('province') ?? '');
  const [city, setCity] = useState(params.get('city') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(params.get('minRating') ?? '');
  const [gender, setGender] = useState(params.get('gender') ?? '');
  const [facility, setFacility] = useState(params.get('facilities') ?? '');
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'locating' | 'found'
  >('idle');

  useEffect(() => {
    if (
      params.get('province') ||
      params.get('city') ||
      !navigator.geolocation
    ) {
      return;
    }

    const applyLocation = (location: CachedLocation) => {
      setProvince(location.province);
      setCity(location.city);
      setLocationStatus('found');
      const next = new URLSearchParams(params.toString());
      next.set('province', location.province);
      next.set('city', location.city);
      next.set('latitude', String(location.latitude));
      next.set('longitude', String(location.longitude));
      router.replace(`/?${next.toString()}`, { scroll: false });
    };

    try {
      const cached = JSON.parse(
        localStorage.getItem(LOCATION_CACHE_KEY) ?? 'null',
      ) as CachedLocation | null;
      if (cached?.expiresAt && cached.expiresAt > Date.now()) {
        applyLocation(cached);
        return;
      }
      if (sessionStorage.getItem(LOCATION_DENIED_KEY) === 'true') return;
    } catch {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }

    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const result = await api.post<LocatedAddress>(
            '/maps/public/reverse-geocode',
            {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          );
          const detectedProvince = findCanonicalLocation(
            result.province ?? '',
            IRAN_PROVINCES,
          );
          const detectedCity = findCanonicalLocation(
            result.city ?? result.county ?? '',
            IRAN_LOCATIONS[detectedProvince] ?? [],
          );
          if (!detectedProvince || !detectedCity) {
            setLocationStatus('idle');
            return;
          }
          const location: CachedLocation = {
            province: detectedProvince,
            city: detectedCity,
            latitude: coords.latitude,
            longitude: coords.longitude,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
          applyLocation(location);
        } catch {
          setLocationStatus('idle');
        }
      },
      () => {
        sessionStorage.setItem(LOCATION_DENIED_KEY, 'true');
        setLocationStatus('idle');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [params, router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (province) next.set('province', province);
    else next.delete('province');
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
    if (
      province !== (params.get('province') ?? '') ||
      city !== (params.get('city') ?? '')
    ) {
      next.delete('latitude');
      next.delete('longitude');
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
    router.push(`/?${next.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="membership-card grid w-full max-w-6xl gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]"
    >
      <select value={province} onChange={(e) => { setProvince(e.target.value); setCity(''); }} aria-label="استان" className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink"><option value="">همه استان‌ها</option>{IRAN_PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}</select>
      <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="شهرستان" disabled={!province} className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-sm text-ink disabled:opacity-50"><option value="">همه شهرستان‌ها</option>{city && !(IRAN_LOCATIONS[province] ?? []).includes(city) && <option value={city}>{city}</option>}{(IRAN_LOCATIONS[province] ?? []).map((name) => <option key={name} value={name}>{name}</option>)}</select>
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
      {locationStatus !== 'idle' && (
        <p className="flex items-center gap-1.5 px-1 text-xs text-muted sm:col-span-2 lg:col-span-full">
          <MapPin className="size-3.5 text-accent-soft" />
          {locationStatus === 'locating'
            ? 'در حال تشخیص شهر فعلی شما…'
            : `شهر فعلی شما: ${city}`}
        </p>
      )}
    </form>
  );
}
