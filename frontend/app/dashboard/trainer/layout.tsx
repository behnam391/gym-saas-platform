import { LayoutDashboard, Users, Dumbbell, Sparkles, Calendar, MessageSquare, TrendingUp, History, Bell, ListTodo, Ticket, Star } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/trainer', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/trainer/students', label: 'شاگردان', icon: Users },
  { href: '/dashboard/trainer/programs', label: 'برنامه‌های تمرینی', icon: Dumbbell },
  { href: '/dashboard/trainer/ai-suggestions', label: 'پیشنهادهای هوش مصنوعی', icon: Sparkles },
  { href: '/dashboard/trainer/progress', label: 'تحلیل پیشرفت', icon: TrendingUp },
  { href: '/dashboard/trainer/attendance', label: 'گزارش حضور', icon: History },
  { href: '/dashboard/trainer/calendar', label: 'تقویم', icon: Calendar },
  { href: '/dashboard/trainer/tasks', label: 'کارها', icon: ListTodo },
  { href: '/dashboard/trainer/messages', label: 'پیام‌ها', icon: MessageSquare },
  { href: '/dashboard/trainer/notifications', label: 'اعلان‌ها', icon: Bell },
  { href: '/dashboard/trainer/tickets', label: 'شکایت‌ها', icon: Ticket },
  { href: '/dashboard/trainer/ratings', label: 'امتیازها', icon: Star },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="پنل مربی" nav={NAV}>{children}</DashboardShell>;
}
