import { MembershipCard } from '../../../components/ui/membership-card';
import { CrowdStatusWidget } from '../../../components/ui/crowd-status-widget';
import { Badge } from '../../../components/ui/badge';
import { CreditCard, Dumbbell, Utensils, Bell } from 'lucide-react';

export default function AthleteOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">سلام 👋</h1>
        <p className="text-muted">خلاصه وضعیت عضویت و فعالیت‌های امروز شما</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ===== Digital membership card — same signature motif as marketplace ===== */}
        <MembershipCard className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm text-muted">
                <CreditCard className="size-4" />
                کارت عضویت دیجیتال
              </p>
              <h2 className="mt-2 text-xl font-bold">باشگاه آرمان فیت</h2>
            </div>
            <Badge tone="success">فعال</Badge>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">پلن عضویت</p>
              <p className="font-semibold">طلایی — ۳ ماهه</p>
            </div>
            <div>
              <p className="text-xs text-muted">تاریخ انقضا</p>
              <p className="font-semibold">۱۴۰۴/۰۹/۱۵</p>
            </div>
          </div>
        </MembershipCard>

        <CrowdStatusWidget />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <MembershipCard>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Dumbbell className="size-4" />
            برنامه تمرینی فعال
          </p>
          <p className="mt-2 text-lg font-bold">کاهش چربی — هفته ۳</p>
          <p className="mt-1 text-sm text-muted">مربی: علی رضایی</p>
        </MembershipCard>

        <MembershipCard>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Utensils className="size-4" />
            برنامه غذایی فعال
          </p>
          <p className="mt-2 text-lg font-bold">۱۸۰۰ کالری روزانه</p>
          <p className="mt-1 text-sm text-muted">متخصص تغذیه: سارا احمدی</p>
        </MembershipCard>
      </div>
    </div>
  );
}
