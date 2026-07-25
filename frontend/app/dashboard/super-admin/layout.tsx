import { LayoutDashboard, Building2, Users, BadgeCheck, Wallet, Trophy, Ticket, CreditCard, BarChart3, Bell, PlugZap, Megaphone, UserRound, ClipboardList } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/super-admin', label: 'نمای کلی پلتفرم', icon: LayoutDashboard },
  { href: '/dashboard/super-admin/gyms', label: 'مدیریت باشگاه‌ها', icon: Building2 },
  { href: '/dashboard/super-admin/users', label: 'کاربران', icon: Users },
  { href: '/dashboard/super-admin/onboarding', label: 'درخواست‌های ثبت‌نام', icon: ClipboardList },
  { href: '/dashboard/super-admin/nutritionists', label: 'تایید متخصصان تغذیه', icon: BadgeCheck },
  { href: '/dashboard/super-admin/financial', label: 'گزارش مالی', icon: Wallet },
  { href: '/dashboard/super-admin/subscriptions', label: 'اشتراک باشگاه‌ها', icon: CreditCard },
  { href: '/dashboard/super-admin/advertisements', label: 'تبلیغات', icon: Megaphone },
  { href: '/dashboard/super-admin/integrations', label: 'اتصال سامانه‌ها', icon: PlugZap },
  { href: '/dashboard/super-admin/analytics', label: 'تحلیل‌ها', icon: BarChart3 },
  { href: '/dashboard/super-admin/rankings', label: 'رتبه‌بندی', icon: Trophy },
  { href: '/dashboard/super-admin/notifications', label: 'اعلان‌ها', icon: Bell },
  { href: '/dashboard/super-admin/tickets', label: 'مرکز پشتیبانی', icon: Ticket },
  { href: '/dashboard/super-admin/profile', label: 'پروفایل من', icon: UserRound },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="پنل مدیر ارشد" nav={NAV}>{children}</DashboardShell>;
}
