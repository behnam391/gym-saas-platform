import { Users, BadgeCheck, Wallet, Ticket } from 'lucide-react';
import { StatCard } from '../../../components/ui/stat-card';
import { CrowdStatusWidget } from '../../../components/ui/crowd-status-widget';

export default function GymOwnerOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">نمای کلی باشگاه</h1>
        <p className="text-muted">خلاصه وضعیت اعضا، مربیان، درآمد و تیکت‌های باز</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="اعضای فعال" value="۴۲۸" icon={Users} />
        <StatCard label="مربیان تایید‌شده" value="۱۲" icon={BadgeCheck} />
        <StatCard label="درآمد این ماه" value="۲۱۰,۰۰۰,۰۰۰ تومان" icon={Wallet} />
        <StatCard label="تیکت باز" value="۵" icon={Ticket} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <CrowdStatusWidget />
      </div>
    </div>
  );
}
