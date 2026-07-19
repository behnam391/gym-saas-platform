import { LayoutDashboard, Building2, Users, BadgeCheck, Wallet, Trophy, Ticket, CreditCard, BarChart3, Bell } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/super-admin', label: 'نمای کلی پلتفرم', icon: LayoutDashboard },
  { href: '/dashboard/super-admin/gyms', label: 'مدیریت باشگاه‌ها', icon: Building2 },
  { href: '/dashboard/super-admin/users', label: 'کاربران', icon: Users },
  { href: '/dashboard/super-admin/nutritionists', label: 'تایید متخصصان تغذیه', icon: BadgeCheck },
  { href: '/dashboard/super-admin/financial', label: 'گزارش مالی', icon: Wallet },
  { href: '/dashboard/super-admin/memberships', label: 'اشتراک‌ها', icon: CreditCard },
  { href: '/dashboard/super-admin/analytics', label: 'تحلیل‌ها', icon: BarChart3 },
  { href: '/dashboard/super-admin/rankings', label: 'رتبه‌بندی', icon: Trophy },
  { href: '/dashboard/super-admin/notifications', label: 'اعلان‌ها', icon: Bell },
  { href: '/dashboard/super-admin/tickets', label: 'مرکز پشتیبانی', icon: Ticket },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="پنل مدیر ارشد" nav={NAV}>{children}</DashboardShell>;
}
