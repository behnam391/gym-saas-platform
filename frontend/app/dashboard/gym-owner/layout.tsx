import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  Coffee,
  Ticket,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/gym-owner', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/gym-owner/members', label: 'اعضا', icon: Users },
  { href: '/dashboard/gym-owner/trainers', label: 'تایید مربیان', icon: BadgeCheck },
  { href: '/dashboard/gym-owner/cafeteria', label: 'بوفه', icon: Coffee },
  { href: '/dashboard/gym-owner/tickets', label: 'مرکز تیکت', icon: Ticket },
  { href: '/dashboard/gym-owner/revenue', label: 'درآمد', icon: Wallet },
  { href: '/dashboard/gym-owner/analytics', label: 'تحلیل‌ها', icon: BarChart3 },
];

export default function GymOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="پنل صاحب باشگاه" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
