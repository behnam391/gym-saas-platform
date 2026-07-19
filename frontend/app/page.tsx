import { api } from '../lib/api';
import { MarketplaceSearchBar } from '../components/ui/marketplace-search-bar';
import { GymCard } from '../components/ui/gym-card';
import { SiteHeader } from '../components/ui/site-header';
import { BadgeCheck, Building2, ShieldCheck, Sparkles } from 'lucide-react';

interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  city: string;
  trustScore: number;
  facilities: { name: string }[];
  membershipPlans: { price: number }[];
  distanceKm?: number | null;
  genderPolicy?: 'MALE' | 'FEMALE' | null;
}

interface MarketplaceParams {
  city?: string;
  maxPrice?: string;
  minRating?: string;
  gender?: string;
  facilities?: string;
}

async function getGyms(params: MarketplaceParams): Promise<TenantSummary[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.size ? `?${query.toString()}` : '';
  try {
    return await api.get<TenantSummary[]>(`/tenants${qs}`);
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<MarketplaceParams>;
}) {
  const params = await searchParams;
  const gyms = await getGyms(params);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {/* ===== Hero ===== */}
      <section className="relative mb-14 overflow-hidden rounded-[2rem] border border-border/10 bg-surface px-5 py-12 text-center sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(201,162,39,.16),transparent_35%),radial-gradient(circle_at_10%_100%,rgba(76,175,109,.10),transparent_30%)]" />
        <div className="relative">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent-soft">
            <Sparkles className="size-4" />
            انتخاب هوشمند باشگاه ورزشی
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.25] sm:text-6xl">
            باشگاه مناسب تو،
            <br />
            <span className="text-accent">شفاف و مطمئن</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted">
            قیمت، امکانات، اعتبار و شلوغی باشگاه‌ها را مقایسه کن؛ آنلاین عضو شو و تمام مسیر ورزشی‌ات را در یک پنل حرفه‌ای مدیریت کن.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <MarketplaceSearchBar />
        </div>
        <div className="relative mx-auto mt-7 grid max-w-3xl grid-cols-3 gap-3 text-right">
          {[
            { icon: Building2, value: '+۴۸', label: 'باشگاه تاییدشده' },
            { icon: ShieldCheck, value: 'امن', label: 'عضویت و پرداخت' },
            { icon: BadgeCheck, value: '+۱۲هزار', label: 'کاربر فعال' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl border border-border/10 bg-base/45 p-3 backdrop-blur sm:p-4">
              <Icon className="mb-2 size-4 text-accent-soft" />
              <p className="font-extrabold sm:text-lg">{value}</p>
              <p className="text-[11px] text-muted sm:text-xs">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Results ===== */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {params.city ? `باشگاه‌های ${params.city}` : 'باشگاه‌های پیشنهادی'}
          </h2>
          <span className="text-sm text-muted">{gyms.length} باشگاه</span>
        </div>

        {gyms.length === 0 ? (
          <div className="membership-card flex flex-col items-center gap-2 p-12 text-center text-muted">
            <p className="font-semibold text-ink">باشگاهی پیدا نشد</p>
            <p className="text-sm">شهر دیگری را امتحان کنید یا فیلترها را تغییر دهید.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gyms.map((g) => (
              <GymCard
                key={g.id}
                slug={g.slug}
                name={g.name}
                city={g.city}
                trustScore={g.trustScore}
                facilities={g.facilities}
                startingPrice={
                  g.membershipPlans.length
                    ? Math.min(...g.membershipPlans.map((p) => p.price))
                    : null
                }
                distanceKm={g.distanceKm}
                genderPolicy={g.genderPolicy}
              />
            ))}
          </div>
        )}
      </section>
      </main>
    </>
  );
}
