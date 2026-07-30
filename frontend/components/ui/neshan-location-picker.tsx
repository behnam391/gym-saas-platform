'use client';

import { LocateFixed, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { Button } from './button';

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
  onAddress?: (value: {
    address?: string;
    province?: string;
    county?: string;
    city?: string;
  }) => void;
}

interface BrowserMapConfig {
  provider: 'NESHAN' | null;
  browserApiKey: string | null;
  configured: boolean;
}

interface ReverseAddress {
  formattedAddress: string | null;
  neighbourhood: string | null;
  city: string | null;
  province: string | null;
  county: string | null;
}

const TEHRAN: [number, number] = [51.389, 35.6892];

export function NeshanLocationPicker({
  latitude,
  longitude,
  onChange,
  onAddress,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [config, setConfig] = useState<BrowserMapConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    api
      .get<BrowserMapConfig>('/maps/browser-config')
      .then(setConfig)
      .catch((cause) =>
        setError(
          cause instanceof ApiError
            ? cause.message
            : 'تنظیمات نقشه دریافت نشد.',
        ),
      );
  }, []);

  useEffect(() => {
    const mapKey = config?.browserApiKey;
    if (!mapKey || !containerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;
    let map: any;
    void import('@neshan-maps-platform/mapbox-gl').then((module) => {
      if (cancelled || !containerRef.current) return;
      const nmp = module.default;
      const center: [number, number] =
        latitude !== null && longitude !== null
          ? [longitude, latitude]
          : TEHRAN;
      map = new nmp.Map({
        mapType: nmp.Map.mapTypes.neshanVector,
        container: containerRef.current,
        zoom: latitude !== null ? 15 : 10,
        pitch: 0,
        center,
        minZoom: 4,
        maxZoom: 20,
        trackResize: true,
        mapKey,
        poi: true,
        traffic: false,
      });
      mapRef.current = map;
      markerRef.current = new nmp.Marker({ color: '#f59e0b', draggable: true })
        .setLngLat(center)
        .addTo(map);

      const selectPoint = (lng: number, lat: number) => {
        markerRef.current?.setLngLat([lng, lat]);
        onChange(lat, lng);
      };
      map.on('click', (event: any) =>
        selectPoint(event.lngLat.lng, event.lngLat.lat),
      );
      markerRef.current.on('dragend', () => {
        const point = markerRef.current.getLngLat();
        selectPoint(point.lng, point.lat);
      });
      map.addControl(new nmp.NavigationControl(), 'top-left');
    }).catch(() => setError('نمایش نقشه نشان ممکن نشد.'));

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [config?.browserApiKey]);

  useEffect(() => {
    if (
      latitude === null ||
      longitude === null ||
      !mapRef.current ||
      !markerRef.current
    ) {
      return;
    }
    markerRef.current.setLngLat([longitude, latitude]);
  }, [latitude, longitude]);

  function useCurrentLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('مکان‌یابی در این دستگاه پشتیبانی نمی‌شود.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange(coords.latitude, coords.longitude);
        markerRef.current?.setLngLat([coords.longitude, coords.latitude]);
        mapRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 16,
        });
      },
      () =>
        setError(
          'دسترسی موقعیت داده نشد؛ نقطه را مستقیماً روی نقشه انتخاب کنید.',
        ),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function resolveAddress() {
    if (latitude === null || longitude === null) {
      setError('ابتدا محل باشگاه را روی نقشه انتخاب کنید.');
      return;
    }
    setResolving(true);
    setError(null);
    try {
      const result = await api.post<ReverseAddress>('/maps/reverse-geocode', {
        latitude,
        longitude,
      });
      onAddress?.({
        address: result.formattedAddress ?? undefined,
        province: result.province ?? undefined,
        county: result.county ?? undefined,
        city: result.city ?? result.neighbourhood ?? undefined,
      });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'دریافت آدرس از نشان انجام نشد.',
      );
    } finally {
      setResolving(false);
    }
  }

  if (config && !config.configured) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm leading-6">
        کلید وب نشان هنوز در بخش اتصال‌های سامانه ثبت نشده است. مختصات را
        می‌توانید دستی وارد کنید.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-bold text-ink">
            <MapPin className="size-4 text-accent-soft" />
            موقعیت دقیق باشگاه
          </p>
          <p className="mt-1 text-xs text-muted">
            روی نقشه کلیک کنید یا نشانگر را جابه‌جا کنید.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={useCurrentLocation}>
          <LocateFixed className="size-4" />
          موقعیت فعلی
        </Button>
      </div>
      <div
        ref={containerRef}
        className="h-80 w-full overflow-hidden rounded-2xl border border-border/10 bg-surface-raised"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted" dir="ltr">
          {latitude !== null && longitude !== null
            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : 'No location selected'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={resolving || latitude === null}
          onClick={resolveAddress}
        >
          {resolving ? 'در حال دریافت آدرس…' : 'تکمیل آدرس از روی نقشه'}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
