import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  Coffee,
  Ticket,
  BarChart3,
  Wallet,
  HandCoins,
  ClipboardCheck,
  CreditCard,
  Stethoscope,
  FileText,
  Bell,
  Images,
  Megaphone,
  PlugZap,
  UserRound,
  Building2,
  UserCog,
} from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/gym-owner', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/gym-owner/members', label: 'اعضا', icon: Users },
  { href: '/dashboard/gym-owner/staff', label: 'پرسنل و دسترسی‌ها', icon: UserCog },
  { href: '/dashboard/gym-owner/memberships', label: 'عضویت‌ها', icon: ClipboardCheck },
  { href: '/dashboard/gym-owner/attendance', label: 'حضور و غیاب', icon: CreditCard },
  { href: '/dashboard/gym-owner/revenue', label: 'درآمد', icon: Wallet },
  { href: '/dashboard/gym-owner/settlements', label: 'قرارداد و تسویه متخصصان', icon: HandCoins },
  { href: '/dashboard/gym-owner/payments', label: 'پرداخت‌ها', icon: CreditCard },
  { href: '/dashboard/gym-owner/trainers', label: 'تایید مربیان', icon: BadgeCheck },
  { href: '/dashboard/gym-owner/nutritionists', label: 'متخصصان تغذیه', icon: Stethoscope },
  { href: '/dashboard/gym-owner/cafeteria', label: 'بوفه', icon: Coffee },
  { href: '/dashboard/gym-owner/media', label: 'تصاویر باشگاه', icon: Images },
  { href: '/dashboard/gym-owner/gym-profile', label: 'پروفایل باشگاه', icon: Building2 },
  { href: '/dashboard/gym-owner/advertisements', label: 'تبلیغات', icon: Megaphone },
  { href: '/dashboard/gym-owner/devices', label: 'ورود مکانیزه و دستگاه‌ها', icon: PlugZap },
  { href: '/dashboard/gym-owner/banking', label: 'حساب‌های تسویه', icon: Wallet },
  { href: '/dashboard/gym-owner/profile', label: 'پروفایل من', icon: UserRound },
  { href: '/dashboard/gym-owner/tickets', label: 'مرکز تیکت', icon: Ticket },
  { href: '/dashboard/gym-owner/analytics', label: 'تحلیل‌ها', icon: BarChart3 },
  { href: '/dashboard/gym-owner/reports', label: 'گزارش‌ها', icon: FileText },
  { href: '/dashboard/gym-owner/notifications', label: 'اعلان‌ها', icon: Bell },
];

export default function GymOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="پنل صاحب باشگاه" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
