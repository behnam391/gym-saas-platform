import { LayoutDashboard, QrCode, Users, Coffee, Ticket } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/reception', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/reception/check-in', label: 'ثبت حضور', icon: QrCode },
  { href: '/dashboard/reception/members', label: 'اعضا', icon: Users },
  { href: '/dashboard/reception/cafeteria', label: 'بوفه', icon: Coffee },
  { href: '/dashboard/reception/tickets', label: 'تیکت‌ها', icon: Ticket },
];

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="پنل پذیرش" nav={NAV}>{children}</DashboardShell>;
}
