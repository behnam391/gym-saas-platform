import { LayoutDashboard, Dumbbell, Utensils, Wallet, Bell, MessageSquare, UserRound, Ruler, TrendingUp, History, Users, ShoppingBag, Target, LifeBuoy, Stethoscope } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/athlete', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/athlete/profile', label: 'پروفایل', icon: UserRound },
  { href: '/dashboard/athlete/measurements', label: 'اندازه‌گیری‌ها', icon: Ruler },
  { href: '/dashboard/athlete/programs', label: 'برنامه تمرینی', icon: Dumbbell },
  { href: '/dashboard/athlete/diet', label: 'برنامه غذایی', icon: Utensils },
  { href: '/dashboard/athlete/experts', label: 'مربی و مشاور سراسری', icon: Stethoscope },
  { href: '/dashboard/athlete/progress', label: 'روند پیشرفت', icon: TrendingUp },
  { href: '/dashboard/athlete/attendance', label: 'سوابق حضور', icon: History },
  { href: '/dashboard/athlete/crowd', label: 'وضعیت شلوغی', icon: Users },
  { href: '/dashboard/athlete/orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { href: '/dashboard/athlete/payments', label: 'پرداخت‌ها', icon: Wallet },
  { href: '/dashboard/athlete/banking', label: 'حساب مالی', icon: Wallet },
  { href: '/dashboard/athlete/goals', label: 'هدف‌ها', icon: Target },
  { href: '/dashboard/athlete/notifications', label: 'اعلان‌ها', icon: Bell },
  { href: '/dashboard/athlete/messages', label: 'پیام‌ها', icon: MessageSquare },
  { href: '/dashboard/athlete/tickets', label: 'پشتیبانی', icon: LifeBuoy },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="پنل ورزشکار" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
