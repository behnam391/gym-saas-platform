import { LayoutDashboard, Users, Utensils, Sparkles, ClipboardList, MessageSquare } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/nutritionist', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/nutritionist/clients', label: 'مشتریان', icon: Users },
  { href: '/dashboard/nutritionist/diet-plans', label: 'رژیم‌های غذایی', icon: Utensils },
  { href: '/dashboard/nutritionist/ai-suggestions', label: 'پیشنهادهای هوش مصنوعی', icon: Sparkles },
  { href: '/dashboard/nutritionist/reports', label: 'گزارش‌های پیشرفت', icon: ClipboardList },
  { href: '/dashboard/nutritionist/messages', label: 'پیام‌ها', icon: MessageSquare },
];

export default function NutritionistLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="پنل متخصص تغذیه" nav={NAV}>{children}</DashboardShell>;
}
