import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Badge } from '../../../components/ui/badge';
import { buttonStyles } from '../../../components/ui/button';
import { SiteHeader } from '../../../components/ui/site-header';
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
} from 'lucide-react';

interface TenantDetail {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  genderPolicy?: 'MALE' | 'FEMALE' | null;
  workingHours?: { weekdays?: string; friday?: string } | null;
  trustScore: number;
  facilities: { name: string }[];
  galleryImages: { url: string; type?: string }[];
  membershipPlans: { id: string; title: string; description?: string | null; price: number; durationDays: number }[];
  trainers?: { id: string; name: string; specialty: string }[];
  nutritionists?: { id: string; name: string; specialty: string }[];
  reviews?: { id: string; author: string; rating: number; comment: string }[];
}

async function getGym(slug: string): Promise<TenantDetail | null> {
  try {
    return await api.get<TenantDetail>(`/tenants/${slug}`);
  } catch {
    return null;
  }
}

export default async function GymDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gym = await getGym(slug);
  if (!gym) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          بازگشت به جستجوی باشگاه‌ها
          <ArrowLeft className="size-4 rotate-180" />
        </Link>

        <section className="relative overflow-hidden rounded-[2rem] border border-border/10 bg-surface p-6 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(201,162,39,.2),transparent_30%),linear-gradient(120deg,transparent,rgba(76,175,109,.05))]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge tone="success">
                  <ShieldCheck className="size-4" />
                  تایید‌شده
                </Badge>
                {gym.genderPolicy && (
                  <Badge tone="muted">
                    <Users className="size-4" />
                    {gym.genderPolicy === 'FEMALE' ? 'ویژه بانوان' : 'ویژه آقایان'}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-extrabold sm:text-5xl">{gym.name}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-muted">
                <MapPin className="size-4 text-accent-soft" />
                {gym.city} — {gym.address}
              </p>
              {gym.description && <p className="mt-6 max-w-3xl leading-8 text-muted">{gym.description}</p>}
            </div>

            <div className="grid min-w-48 grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-accent/20 bg-base/50 p-4 text-center">
                <p className="flex items-center justify-center gap-1 text-sm text-accent-soft">
                  <Star className="size-4 fill-current" /> امتیاز اعتماد
                </p>
                <p className="mt-1 text-3xl font-extrabold">{gym.trustScore.toFixed(0)}</p>
              </div>
              <div className="rounded-2xl border border-border/10 bg-base/50 p-4 text-center">
                <p className="text-xs text-muted">شروع عضویت از</p>
                <p className="mt-1 font-extrabold text-accent-soft">
                  {Math.min(...gym.membershipPlans.map((plan) => Number(plan.price))).toLocaleString('fa-IR')}
                  <span className="mr-1 text-xs font-normal text-muted">تومان</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl font-bold">پلن‌های عضویت</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {gym.membershipPlans.map((plan, index) => (
                  <MembershipCard key={plan.id} className="flex flex-col">
                    {index === 1 && <Badge tone="accent" className="mb-3 w-fit">پیشنهاد باشگاه</Badge>}
                    <h3 className="text-lg font-bold">{plan.title}</h3>
                    <p className="mt-2 flex items-center gap-1 text-sm text-muted">
                      <Clock className="size-3.5" />
                      {plan.durationDays.toLocaleString('fa-IR')} روز دسترسی
                    </p>
                    <p className="mt-5 text-2xl font-extrabold text-accent-soft">
                      {Number(plan.price).toLocaleString('fa-IR')}
                      <span className="mr-1 text-sm font-normal text-muted">تومان</span>
                    </p>
                    <Link
                      href={`/auth/register?tenantId=${gym.id}&membershipPlanId=${plan.id}`}
                      className={buttonStyles({ className: 'mt-5 w-full' })}
                    >
                      درخواست عضویت
                    </Link>
                  </MembershipCard>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold">تیم حرفه‌ای باشگاه</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(gym.trainers ?? []).map((trainer) => (
                  <MembershipCard key={trainer.id} className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-soft">
                      <Dumbbell className="size-5" />
                    </span>
                    <div>
                      <p className="font-bold">{trainer.name}</p>
                      <p className="text-sm text-muted">{trainer.specialty}</p>
                    </div>
                  </MembershipCard>
                ))}
                {(gym.nutritionists ?? []).map((nutritionist) => (
                  <MembershipCard key={nutritionist.id} className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-success/10 text-success">
                      <Stethoscope className="size-5" />
                    </span>
                    <div>
                      <p className="font-bold">{nutritionist.name}</p>
                      <p className="text-sm text-muted">{nutritionist.specialty}</p>
                    </div>
                  </MembershipCard>
                ))}
                {!gym.trainers?.length && !gym.nutritionists?.length && (
                  <MembershipCard className="sm:col-span-2 text-center text-muted">
                    اطلاعات تیم حرفه‌ای به‌زودی تکمیل می‌شود.
                  </MembershipCard>
                )}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">نظر اعضا</h2>
                <span className="text-sm text-muted">{gym.reviews?.length ?? 0} نظر تاییدشده</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(gym.reviews ?? []).map((review) => (
                  <MembershipCard key={review.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{review.author}</p>
                      <span className="flex items-center gap-1 text-sm text-accent-soft">
                        <Star className="size-4 fill-current" /> {review.rating.toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted">{review.comment}</p>
                  </MembershipCard>
                ))}
                {!gym.reviews?.length && (
                  <MembershipCard className="sm:col-span-2 text-center text-muted">هنوز نظری ثبت نشده است.</MembershipCard>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <MembershipCard>
              <h2 className="font-bold">امکانات باشگاه</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {gym.facilities.map((facility) => <Badge key={facility.name} tone="muted">{facility.name}</Badge>)}
              </div>
            </MembershipCard>

            <MembershipCard>
              <h2 className="font-bold">ساعات کاری</h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center justify-between gap-4"><span className="text-muted">شنبه تا پنج‌شنبه</span><span>{gym.workingHours?.weekdays ?? 'ثبت نشده'}</span></p>
                <p className="flex items-center justify-between gap-4"><span className="text-muted">جمعه</span><span>{gym.workingHours?.friday ?? 'ثبت نشده'}</span></p>
              </div>
            </MembershipCard>

            <MembershipCard>
              <h2 className="font-bold">ارتباط و مشاوره</h2>
              <div className="mt-4 space-y-3 text-sm text-muted">
                {gym.phone && <p className="flex items-center gap-2"><Phone className="size-4 text-accent-soft" />{gym.phone}</p>}
                {gym.email && <p className="flex items-center gap-2"><Mail className="size-4 text-accent-soft" />{gym.email}</p>}
              </div>
              <Link href={`/auth/register?tenantId=${gym.id}`} className={buttonStyles({ variant: 'secondary', className: 'mt-5 w-full' })}>
                <MessageCircle className="size-4" />
                درخواست مشاوره
              </Link>
            </MembershipCard>
          </aside>
        </div>
      </main>
    </>
  );
}

