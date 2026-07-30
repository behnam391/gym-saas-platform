import { api } from '../lib/api';
import { MarketplaceSearchBar } from '../components/ui/marketplace-search-bar';
import { GymCard } from '../components/ui/gym-card';
import { SiteHeader } from '../components/ui/site-header';
import { BadgeCheck, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Megaphone, MapPin } from 'lucide-react';
import { HeroSlide, PublicHeroSlider } from '../components/ui/public-hero-slider';

interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  city: string;
  province?: string | null;
  coverImageUrl?: string | null;
  trustScore: number;
  facilities: { name: string }[];
  membershipPlans: { price: number }[];
  distanceKm?: number | null;
  genderPolicy?: 'MALE' | 'FEMALE' | null;
}

interface MarketplaceParams {
  province?: string;
  city?: string;
  maxPrice?: string;
  minRating?: string;
  gender?: string;
  facilities?: string;
  latitude?: string;
  longitude?: string;
}

interface Advertisement {
  id: string;
  title: string;
  description?: string | null;
  destinationUrl?: string | null;
  province: string;
  city?: string | null;
  tenant: { slug: string; name: string };
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

async function getAdvertisements(params: MarketplaceParams): Promise<Advertisement[]> {
  const query = new URLSearchParams();
  if (params.province) query.set('province', params.province);
  if (params.city) query.set('city', params.city);
  try { return await api.get<Advertisement[]>(`/advertisements/public${query.size ? `?${query}` : ''}`); } catch { return []; }
}

async function getHeroSlides(): Promise<HeroSlide[]> {
  try { return await api.get<HeroSlide[]>('/site-content/hero-slides'); } catch { return []; }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<MarketplaceParams>;
}) {
  const params = await searchParams;
  const [gyms, advertisements, heroSlides] = await Promise.all([getGyms(params), getAdvertisements(params), getHeroSlides()]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <PublicHeroSlider slides={heroSlides} />
      <section className="relative mb-14 rounded-[2rem] border border-border/10 bg-surface p-5 sm:p-7">
        <div className="flex justify-center"><MarketplaceSearchBar /></div>
        <div className="relative mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-3 text-right">
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

      {advertisements.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-extrabold"><Megaphone className="size-5 text-accent-soft" />پیشنهادهای ویژه {params.province ? `در ${params.province}` : ''}</h2><span className="text-xs text-muted">تبلیغات تاییدشده</span></div>
          <div className="grid gap-4 md:grid-cols-2">{advertisements.map((ad) => <Link key={ad.id} href={ad.destinationUrl || `/gyms/${ad.tenant.slug}`} className="group overflow-hidden rounded-2xl border border-accent/20 bg-[linear-gradient(135deg,rgba(201,162,39,.14),rgba(76,175,109,.07))] p-5 transition hover:-translate-y-0.5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-accent-soft">{ad.tenant.name}</p><h3 className="mt-2 text-lg font-extrabold">{ad.title}</h3>{ad.description && <p className="mt-2 text-sm leading-6 text-muted">{ad.description}</p>}</div><Megaphone className="size-6 shrink-0 text-accent-soft" /></div><p className="mt-4 flex items-center gap-1 text-xs text-muted"><MapPin className="size-3.5" />{ad.province}{ad.city ? `، ${ad.city}` : '، سراسر استان'}</p></Link>)}</div>
        </section>
      )}

      {/* ===== Results ===== */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {params.city ? `باشگاه‌های ${params.city}` : params.province ? `باشگاه‌های استان ${params.province}` : 'باشگاه‌های پیشنهادی'}
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
                coverImageUrl={g.coverImageUrl}
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
