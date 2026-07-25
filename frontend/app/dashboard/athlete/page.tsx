import { cookies } from 'next/headers';
import { CreditCard, Dumbbell, Utensils } from 'lucide-react';
import { api } from '../../../lib/api';
import { MembershipCard } from '../../../components/ui/membership-card';
import { CrowdStatusWidget } from '../../../components/ui/crowd-status-widget';
import { Badge } from '../../../components/ui/badge';

interface AthleteProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  memberships: Array<{
    id: string;
    status: string;
    endDate: string | null;
    plan: { title: string };
    tenant: { name: string; slug: string };
  }>;
}

interface TrainingProgram {
  id: string;
  title: string;
  status: string;
  trainer?: { user?: { firstName: string; lastName: string } };
}

interface DietPlan {
  id: string;
  title: string;
  dailyCalories?: number | null;
  status: string;
  nutritionist?: { user?: { firstName: string; lastName: string } };
}

async function getDashboardData() {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    const profile = await api.get<AthleteProfileResponse>('/athletes/me/profile', { accessToken: token });
    const [programs, diets] = await Promise.all([
      api.get<TrainingProgram[]>(`/programs/athlete/${profile.id}`, { accessToken: token }).catch(() => []),
      api.get<DietPlan[]>(`/diet/athlete/${profile.id}`, { accessToken: token }).catch(() => []),
    ]);
    return { profile, programs, diets };
  } catch {
    return null;
  }
}

const MEMBERSHIP_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  PENDING_INSURANCE: 'در انتظار بیمه',
  PENDING_PAYMENT: 'در انتظار پرداخت',
  EXPIRED: 'منقضی‌شده',
  SUSPENDED: 'تعلیق‌شده',
  CANCELLED: 'لغوشده',
};

export default async function AthleteOverviewPage() {
  const data = await getDashboardData();
  const membership = data?.profile.memberships[0];
  const program = data?.programs.find((item) => item.status === 'ACTIVE') ?? data?.programs[0];
  const diet = data?.diets.find((item) => item.status === 'ACTIVE') ?? data?.diets[0];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">
          {data ? `سلام ${data.profile.firstName} 👋` : 'سلام 👋'}
        </h1>
        <p className="text-muted">خلاصه وضعیت عضویت و فعالیت‌های امروز شما</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <MembershipCard className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm text-muted"><CreditCard className="size-4" />کارت عضویت دیجیتال</p>
              <h2 className="mt-2 text-xl font-bold">{membership?.tenant.name ?? 'هنوز باشگاهی انتخاب نشده است'}</h2>
            </div>
            {membership && (
              <Badge tone={membership.status === 'ACTIVE' ? 'success' : 'warning'}>
                {MEMBERSHIP_LABELS[membership.status] ?? membership.status}
              </Badge>
            )}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">پلن عضویت</p>
              <p className="font-semibold">{membership?.plan.title ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">تاریخ انقضا</p>
              <p className="font-semibold">
                {membership?.endDate
                  ? new Date(membership.endDate).toLocaleDateString('fa-IR-u-ca-persian')
                  : 'پس از فعال‌سازی'}
              </p>
            </div>
          </div>
        </MembershipCard>

        <CrowdStatusWidget />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <MembershipCard>
          <p className="flex items-center gap-2 text-sm text-muted"><Dumbbell className="size-4" />برنامه تمرینی فعال</p>
          <p className="mt-2 text-lg font-bold">{program?.title ?? 'هنوز برنامه‌ای ثبت نشده است'}</p>
          <p className="mt-1 text-sm text-muted">
            {program?.trainer?.user
              ? `مربی: ${program.trainer.user.firstName} ${program.trainer.user.lastName}`
              : 'پس از تخصیص مربی، برنامه اینجا نمایش داده می‌شود.'}
          </p>
        </MembershipCard>

        <MembershipCard>
          <p className="flex items-center gap-2 text-sm text-muted"><Utensils className="size-4" />برنامه غذایی فعال</p>
          <p className="mt-2 text-lg font-bold">
            {diet ? `${diet.title}${diet.dailyCalories ? ` · ${diet.dailyCalories.toLocaleString('fa-IR')} کالری` : ''}` : 'هنوز برنامه‌ای ثبت نشده است'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {diet?.nutritionist?.user
              ? `متخصص تغذیه: ${diet.nutritionist.user.firstName} ${diet.nutritionist.user.lastName}`
              : 'پس از تایید متخصص تغذیه، رژیم اینجا نمایش داده می‌شود.'}
          </p>
        </MembershipCard>
      </div>
    </div>
  );
}
