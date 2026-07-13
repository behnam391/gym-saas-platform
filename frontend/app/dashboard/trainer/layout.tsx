import { LayoutDashboard, Users, Dumbbell, Sparkles, Calendar, MessageSquare } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/trainer', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/trainer/students', label: 'شاگردان', icon: Users },
  { href: '/dashboard/trainer/programs', label: 'برنامه‌های تمرینی', icon: Dumbbell },
  { href: '/dashboard/trainer/ai-suggestions', label: 'پیشنهادهای هوش مصنوعی', icon: Sparkles },
  { href: '/dashboard/trainer/calendar', label: 'تقویم', icon: Calendar },
  { href: '/dashboard/trainer/messages', label: 'پیام‌ها', icon: MessageSquare },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="پنل مربی" nav={NAV}>{children}</DashboardShell>;
}
