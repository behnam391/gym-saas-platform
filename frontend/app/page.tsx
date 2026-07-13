import { api } from '../lib/api';
import { MarketplaceSearchBar } from '../components/ui/marketplace-search-bar';
import { GymCard } from '../components/ui/gym-card';

interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  city: string;
  trustScore: number;
  facilities: { name: string }[];
  membershipPlans: { price: number }[];
  distanceKm?: number | null;
}

async function getGyms(city?: string): Promise<TenantSummary[]> {
  const qs = city ? `?city=${encodeURIComponent(city)}` : '';
  try {
    return await api.get<TenantSummary[]>(`/tenants${qs}`);
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { city?: string };
}) {
  const gyms = await getGyms(searchParams.city);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* ===== Hero ===== */}
      <section className="mb-14 text-center">
        <p className="mb-3 text-sm font-semibold tracking-wide text-accent-soft">
          مارکت‌پلیس باشگاه‌های ورزشی
        </p>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          باشگاه بعدی‌ات را
          <br />
          <span className="text-accent">مثل یک عضو دائمی</span> انتخاب کن
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          مقایسه قیمت، امکانات، امتیاز اعتماد و فاصله — همه در یک کارت عضویت دیجیتال.
        </p>
        <div className="mt-8 flex justify-center">
          <MarketplaceSearchBar />
        </div>
      </section>

      {/* ===== Results ===== */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {searchParams.city ? `باشگاه‌های ${searchParams.city}` : 'باشگاه‌های برتر'}
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
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
