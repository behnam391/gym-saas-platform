import Link from 'next/link';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';
import { Star, MapPin, ArrowLeft, Users } from 'lucide-react';

interface GymCardProps {
  slug: string;
  name: string;
  city: string;
  trustScore: number;
  coverImageUrl?: string | null;
  facilities: { name: string }[];
  startingPrice?: number | null;
  distanceKm?: number | null;
  genderPolicy?: 'MALE' | 'FEMALE' | null;
}

export function GymCard({
  slug,
  name,
  city,
  trustScore,
  coverImageUrl,
  facilities,
  startingPrice,
  distanceKm,
  genderPolicy,
}: GymCardProps) {
  return (
    <Link href={`/gyms/${slug}`} className="block">
      <MembershipCard className="group flex h-full flex-col overflow-hidden p-0 transition-transform hover:-translate-y-1">
        <div className="relative h-32 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(228,199,102,0.28),transparent_32%),linear-gradient(135deg,#243b34,#101c18)]">
          {coverImageUrl && <img src={coverImageUrl} alt={`نمای ${name}`} className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,transparent_49%,rgba(255,255,255,.05)_50%,transparent_51%)] [background-size:24px_24px]" />
          <div className="absolute bottom-3 right-4 grid size-12 place-items-center rounded-2xl border border-accent/30 bg-base/80 text-xl font-extrabold text-accent-soft backdrop-blur">
            {name.slice(0, 1)}
          </div>
          {genderPolicy && (
            <Badge tone="muted" className="absolute left-3 top-3 bg-base/75 backdrop-blur">
              <Users className="size-3.5" />
              {genderPolicy === 'FEMALE' ? 'ویژه بانوان' : 'ویژه آقایان'}
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <MapPin className="size-3.5" />
              {city}
              {distanceKm != null && <span> · {distanceKm.toFixed(1)} کیلومتر</span>}
            </p>
          </div>
          <Badge tone="accent">
            <Star className="size-3.5 fill-current" />
            {trustScore.toFixed(0)}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {facilities.slice(0, 4).map((f) => (
            <Badge key={f.name} tone="muted">
              {f.name}
            </Badge>
          ))}
        </div>

        {startingPrice != null && (
          <p className="mt-auto pt-5 text-sm text-muted">
            شروع پلن‌ها از{' '}
            <span className="font-bold text-accent-soft">
              {startingPrice.toLocaleString('fa-IR')} تومان
            </span>
          </p>
        )}
        <p className="mt-4 flex items-center gap-1 text-sm font-bold text-accent-soft">
          مشاهده پروفایل باشگاه
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        </p>
        </div>
      </MembershipCard>
    </Link>
  );
}
