import { LayoutDashboard, ShoppingBag, Package, Wallet, UserRound } from 'lucide-react';
import { DashboardShell } from '../../../components/ui/dashboard-shell';

const NAV = [
  { href: '/dashboard/buffet', label: 'نمای کلی فروش', icon: LayoutDashboard },
  { href: '/dashboard/buffet/orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { href: '/dashboard/buffet/products', label: 'محصولات و موجودی', icon: Package },
  { href: '/dashboard/buffet/banking', label: 'حساب‌های مالی', icon: Wallet },
  { href: '/dashboard/buffet/profile', label: 'پروفایل من', icon: UserRound },
];
export default function BuffetLayout({ children }: { children: React.ReactNode }) { return <DashboardShell title="پنل بوفه‌دار" nav={NAV}>{children}</DashboardShell>; }
