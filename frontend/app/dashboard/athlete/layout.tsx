import { LayoutDashboard, Dumbbell, Utensils, Wallet, Bell, MessageSquare } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/athlete', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/athlete/programs', label: 'برنامه تمرینی', icon: Dumbbell },
  { href: '/dashboard/athlete/diet', label: 'برنامه غذایی', icon: Utensils },
  { href: '/dashboard/athlete/payments', label: 'پرداخت‌ها', icon: Wallet },
  { href: '/dashboard/athlete/notifications', label: 'اعلان‌ها', icon: Bell },
  { href: '/dashboard/athlete/messages', label: 'پیام‌ها', icon: MessageSquare },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="پنل ورزشکار" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
