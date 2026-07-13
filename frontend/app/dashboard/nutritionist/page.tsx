import { Users, Utensils, Sparkles } from 'lucide-react';
import { StatCard } from '../../../components/ui/stat-card';
import { MembershipCard } from '../../../components/ui/membership-card';
import { Badge } from '../../../components/ui/badge';

export default function NutritionistOverviewPage() {
  // In production: fetch own NutritionistProfile.status and show a banner
  // like the one below whenever it's not yet APPROVED — nutritionists
  // cannot create diet plans until Super Admin approves them.
  const verificationStatus: 'PENDING' | 'APPROVED' = 'APPROVED';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">نمای کلی متخصص تغذیه</h1>
          <p className="text-muted">مشتریان فعال و رژیم‌های غذایی در حال اجرا</p>
        </div>
        <Badge tone={verificationStatus === 'APPROVED' ? 'success' : 'warning'}>
          {verificationStatus === 'APPROVED' ? 'تایید‌شده توسط Super Admin' : 'در انتظار تایید'}
        </Badge>
      </header>

      {verificationStatus !== 'APPROVED' && (
        <MembershipCard className="border-warning/40 text-warning">
          حساب شما هنوز توسط مدیر ارشد پلتفرم تایید نشده است. تا تایید نهایی، امکان ساخت رژیم غذایی فعال وجود ندارد.
        </MembershipCard>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="مشتریان فعال" value="—" icon={Users} />
        <StatCard label="رژیم‌های فعال" value="—" icon={Utensils} />
        <StatCard label="پیشنهاد AI در انتظار" value="—" icon={Sparkles} />
      </div>
    </div>
  );
}
