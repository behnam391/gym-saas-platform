'use client';

import { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { IRAN_LOCATIONS, IRAN_PROVINCES } from '../../lib/iran-locations';
import { Button } from './button';
import { Input } from './input';
import { MembershipCard } from './membership-card';
import { NeshanLocationPicker } from './neshan-location-picker';

interface GymProfile {
  name: string;
  description?: string | null;
  province?: string | null;
  county?: string | null;
  city: string;
  address: string;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function GymProfileManager({ initial }: { initial: GymProfile }) {
  const [form, setForm] = useState({
    name: initial.name,
    description: initial.description ?? '',
    province: initial.province ?? '',
    county: initial.county ?? '',
    city: initial.city,
    address: initial.address,
    latitude: initial.latitude ?? null,
    longitude: initial.longitude ?? null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await api.patch('/tenants/me/profile', form);
      setMessage('اطلاعات و موقعیت باشگاه ذخیره شد.');
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'ذخیره انجام نشد.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MembershipCard>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="نام باشگاه"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          استان
          <select
            className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink"
            value={form.province}
            onChange={(event) =>
              setForm({
                ...form,
                province: event.target.value,
                county: '',
                city: '',
              })
            }
          >
            <option value="">انتخاب استان</option>
            {IRAN_PROVINCES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          شهرستان
          <select
            className="h-11 rounded-xl border border-border/10 bg-surface px-3 text-ink"
            value={form.county}
            onChange={(event) =>
              setForm({
                ...form,
                county: event.target.value,
                city: event.target.value,
              })
            }
          >
            <option value="">انتخاب شهرستان</option>
            {(IRAN_LOCATIONS[form.province] ?? []).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <Input
          label="شهر / محله"
          value={form.city}
          onChange={(event) => setForm({ ...form, city: event.target.value })}
          required
        />
        <Input
          label="آدرس کامل"
          value={form.address}
          onChange={(event) =>
            setForm({ ...form, address: event.target.value })
          }
          required
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <NeshanLocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(latitude, longitude) =>
              setForm((current) => ({ ...current, latitude, longitude }))
            }
            onAddress={(location) =>
              setForm((current) => ({
                ...current,
                address: location.address ?? current.address,
                province: location.province ?? current.province,
                county: location.county ?? current.county,
                city: location.city ?? current.city,
              }))
            }
          />
        </div>
        <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">
          معرفی باشگاه
          <textarea
            className="min-h-32 rounded-xl border border-border/10 bg-surface px-4 py-3 text-ink"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </label>
        {message && (
          <p className="text-sm text-success sm:col-span-2">{message}</p>
        )}
        {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:w-fit">
          {loading ? 'در حال ذخیره…' : 'ذخیره اطلاعات باشگاه'}
        </Button>
      </form>
    </MembershipCard>
  );
}
