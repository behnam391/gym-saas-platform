import { notFound } from 'next/navigation';
import { api } from '../../../lib/api';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { MapPin, Star, Clock } from 'lucide-react';

interface TenantDetail {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string;
  trustScore: number;
  facilities: { name: string }[];
  galleryImages: { url: string }[];
  membershipPlans: { id: string; title: string; price: number; durationDays: number }[];
}

async function getGym(slug: string): Promise<TenantDetail | null> {
  try {
    return await api.get<TenantDetail>(`/tenants/${slug}`);
  } catch {
    return null;
  }
}

export default async function GymDetailPage({ params }: { params: { slug: string } }) {
  const gym = await getGym(params.slug);
  if (!gym) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">{gym.name}</h1>
            <p className="mt-2 flex items-center gap-1 text-muted">
              <MapPin className="size-4" />
              {gym.city} — {gym.address}
            </p>
          </div>
          <Badge tone="accent" className="text-base">
            <Star className="size-4 fill-current" />
            {gym.trustScore.toFixed(0)} امتیاز اعتماد
          </Badge>
        </div>

        {gym.description && <p className="mt-5 max-w-2xl text-muted">{gym.description}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {gym.facilities.map((f) => (
            <Badge key={f.name} tone="muted">
              {f.name}
            </Badge>
          ))}
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-bold">پلن‌های عضویت</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gym.membershipPlans.map((plan) => (
            <MembershipCard key={plan.id} className="flex flex-col">
              <h3 className="text-lg font-bold">{plan.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                <Clock className="size-3.5" />
                {plan.durationDays} روز
              </p>
              <p className="mt-4 text-2xl font-extrabold text-accent-soft">
                {plan.price.toLocaleString('fa-IR')}
                <span className="mr-1 text-sm font-normal text-muted"> تومان</span>
              </p>
              <Button className="mt-5 w-full" variant="primary">
                درخواست عضویت
              </Button>
            </MembershipCard>
          ))}
        </div>
      </section>
    </main>
  );
}
