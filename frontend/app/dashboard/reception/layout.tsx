import { LayoutDashboard, QrCode, Users, Coffee, Ticket, UserRound, Wallet } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/reception', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/reception/check-in', label: 'ثبت حضور', icon: QrCode },
  { href: '/dashboard/reception/members', label: 'اعضا', icon: Users },
  { href: '/dashboard/reception/cafeteria', label: 'بوفه', icon: Coffee },
  { href: '/dashboard/reception/tickets', label: 'تیکت‌ها', icon: Ticket },
  { href: '/dashboard/reception/banking', label: 'حساب مالی', icon: Wallet },
  { href: '/dashboard/reception/profile', label: 'پروفایل من', icon: UserRound },
];

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="پنل پذیرش" nav={NAV}>{children}</DashboardShell>;
}
