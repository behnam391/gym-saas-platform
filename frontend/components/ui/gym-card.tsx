import Link from 'next/link';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';
import { Star, MapPin } from 'lucide-react';

interface GymCardProps {
  slug: string;
  name: string;
  city: string;
  trustScore: number;
  coverImageUrl?: string | null;
  facilities: { name: string }[];
  startingPrice?: number | null;
  distanceKm?: number | null;
}

export function GymCard({
  slug,
  name,
  city,
  trustScore,
  facilities,
  startingPrice,
  distanceKm,
}: GymCardProps) {
  return (
    <Link href={`/gyms/${slug}`} className="block">
      <MembershipCard className="h-full transition-transform hover:-translate-y-1">
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
          <p className="mt-5 text-sm text-muted">
            شروع پلن‌ها از{' '}
            <span className="font-bold text-accent-soft">
              {startingPrice.toLocaleString('fa-IR')} تومان
            </span>
          </p>
        )}
      </MembershipCard>
    </Link>
  );
}
