export const LOGIN_PORTALS = {
  athlete: { title: 'ورزشکار', subtitle: 'برنامه، رژیم، پیشرفت و عضویت', role: 'ATHLETE', identifier: '09120000002', tone: 'emerald' },
  owner: { title: 'صاحب باشگاه', subtitle: 'مدیریت کامل مجموعه و درآمد', role: 'GYM_OWNER', identifier: '09120000001', tone: 'amber' },
  trainer: { title: 'مربی', subtitle: 'شاگردان و برنامه‌های تمرینی', role: 'TRAINER', identifier: '09120000003', tone: 'blue' },
  nutritionist: { title: 'مشاور تغذیه', subtitle: 'مراجعان و برنامه‌های غذایی', role: 'NUTRITIONIST', identifier: '09120000004', tone: 'violet' },
  reception: { title: 'پذیرش', subtitle: 'ورود و خروج، اعضا و پاسخگویی', role: 'RECEPTION', identifier: '09120000005', tone: 'cyan' },
  buffet: { title: 'بوفه‌دار', subtitle: 'سفارش‌ها، موجودی و فروش روزانه', role: 'BUFFET_STAFF', identifier: '09120000009', tone: 'orange' },
  admin: { title: 'مدیر ارشد سامانه', subtitle: 'باشگاه‌ها، اشتراک‌ها و اتصال‌ها', role: 'SUPER_ADMIN', identifier: '09120000000', tone: 'rose' },
} as const;

export type LoginPortalKey = keyof typeof LOGIN_PORTALS;

export function isLoginPortal(value: string): value is LoginPortalKey {
  return value in LOGIN_PORTALS;
}
