type DemoMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface DemoRequestOptions {
  method?: DemoMethod;
  body?: unknown;
  accessToken?: string;
}

const TENANT_ID = '11111111-1111-4111-8111-111111111111';

const gyms = [
  {
    id: TENANT_ID,
    slug: 'arman-fit',
    name: 'باشگاه آرمان فیت',
    description:
      'مجموعه تخصصی تمرینات قدرتی و تناسب اندام با مربیان تاییدشده، پایش پیشرفت و برنامه‌های شخصی‌سازی‌شده.',
    city: 'تهران',
    address: 'سعادت‌آباد، بلوار دریا، پلاک ۲۸',
    latitude: 35.777,
    longitude: 51.365,
    phone: '۰۲۱-۲۲۱۱۰۰۱۰',
    email: 'hello@armanfit.ir',
    genderPolicy: null,
    trustScore: 94,
    workingHours: { weekdays: '۶:۰۰ تا ۲۳:۰۰', friday: '۸:۰۰ تا ۲۰:۰۰' },
    facilities: [
      { name: 'پارکینگ' },
      { name: 'سونا' },
      { name: 'دوش اختصاصی' },
      { name: 'بوفه سلامت' },
    ],
    galleryImages: [],
    membershipPlans: [
      { id: 'plan-arman-1', title: 'عضویت یک‌ماهه', price: 1450000, durationDays: 30 },
      { id: 'plan-arman-3', title: 'عضویت طلایی سه‌ماهه', price: 3850000, durationDays: 90 },
      { id: 'plan-arman-6', title: 'عضویت حرفه‌ای شش‌ماهه', price: 6900000, durationDays: 180 },
    ],
    trainers: [
      { id: 'trainer-1', name: 'علی رضایی', specialty: 'بدنسازی و اصلاح فرم' },
      { id: 'trainer-2', name: 'نیما فرهمند', specialty: 'تمرینات عملکردی' },
    ],
    nutritionists: [{ id: 'nutritionist-1', name: 'دکتر سارا احمدی', specialty: 'تغذیه ورزشی' }],
    reviews: [
      { id: 'review-1', author: 'مریم اکبری', rating: 5, comment: 'محیط تمیز و مربیان بسیار پیگیر هستند.' },
      { id: 'review-2', author: 'محمد کریمی', rating: 4, comment: 'تجهیزات کامل و ساعت کاری مناسب.' },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'her-power',
    name: 'باشگاه بانوان هِر پاور',
    description: 'باشگاه تخصصی بانوان با کلاس‌های گروهی، پیلاتس، فانکشنال و مشاوره تغذیه.',
    city: 'تهران',
    address: 'پاسداران، خیابان گلستان پنجم، پلاک ۱۲',
    latitude: 35.78,
    longitude: 51.46,
    phone: '۰۲۱-۲۲۵۸۸۰۳۰',
    email: 'contact@herpower.ir',
    genderPolicy: 'FEMALE',
    trustScore: 91,
    workingHours: { weekdays: '۷:۰۰ تا ۲۲:۰۰', friday: '۹:۰۰ تا ۱۸:۰۰' },
    facilities: [{ name: 'پیلاتس' }, { name: 'کلاس گروهی' }, { name: 'پارکینگ' }, { name: 'اتاق کودک' }],
    galleryImages: [],
    membershipPlans: [
      { id: 'plan-her-1', title: 'عضویت پایه', price: 1200000, durationDays: 30 },
      { id: 'plan-her-3', title: 'عضویت سه‌ماهه پلاس', price: 3200000, durationDays: 90 },
    ],
    trainers: [{ id: 'trainer-3', name: 'الهام نوری', specialty: 'پیلاتس و فانکشنال' }],
    nutritionists: [{ id: 'nutritionist-2', name: 'دکتر مهسا زمانی', specialty: 'کنترل وزن' }],
    reviews: [{ id: 'review-3', author: 'زهرا مرادی', rating: 5, comment: 'کلاس‌های گروهی منظم و فضای بسیار حرفه‌ای.' }],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'atlas-strength',
    name: 'اطلس استرِنگث',
    description: 'مرکز تمرینات قدرتی، پاورلیفتینگ و آمادگی جسمانی برای ورزشکاران نیمه‌حرفه‌ای و حرفه‌ای.',
    city: 'کرج',
    address: 'جهانشهر، بلوار جمهوری، نبش خیابان بهار',
    latitude: 35.82,
    longitude: 50.97,
    phone: '۰۲۶-۳۲۵۰۱۰۲۰',
    email: 'team@atlasstrength.ir',
    genderPolicy: 'MALE',
    trustScore: 88,
    workingHours: { weekdays: '۶:۳۰ تا ۲۳:۳۰', friday: '۸:۰۰ تا ۱۷:۰۰' },
    facilities: [{ name: 'وزنه آزاد' }, { name: 'کراس‌فیت' }, { name: 'فیزیوتراپی' }],
    galleryImages: [],
    membershipPlans: [
      { id: 'plan-atlas-1', title: 'عضویت ماهانه', price: 980000, durationDays: 30 },
      { id: 'plan-atlas-3', title: 'عضویت قهرمانی', price: 2700000, durationDays: 90 },
    ],
    trainers: [{ id: 'trainer-4', name: 'سامان کاظمی', specialty: 'قدرت و پاورلیفتینگ' }],
    nutritionists: [],
    reviews: [{ id: 'review-4', author: 'آرمان یوسفی', rating: 4, comment: 'برای تمرین قدرتی یکی از بهترین انتخاب‌هاست.' }],
  },
];

const demoAccounts: Record<string, { role: string; tenantId: string | null; name: string }> = {
  '09120000000': { role: 'SUPER_ADMIN', tenantId: null, name: 'مدیر ارشد' },
  '09120000001': { role: 'GYM_OWNER', tenantId: TENANT_ID, name: 'مدیر باشگاه' },
  '09120000002': { role: 'ATHLETE', tenantId: TENANT_ID, name: 'ورزشکار' },
  '09120000003': { role: 'TRAINER', tenantId: TENANT_ID, name: 'مربی' },
  '09120000004': { role: 'NUTRITIONIST', tenantId: TENANT_ID, name: 'متخصص تغذیه' },
  '09120000005': { role: 'RECEPTION', tenantId: TENANT_ID, name: 'پذیرش' },
};

const members = [
  { id: 'member-1', firstName: 'مریم', lastName: 'اکبری', mobile: '۰۹۱۲۱۲۳۴۵۶۷', isMinor: false, isRestricted: false, createdAt: '2026-07-12' },
  { id: 'member-2', firstName: 'امیرعلی', lastName: 'نجفی', mobile: '۰۹۱۹۳۴۵۶۷۸۹', isMinor: true, isRestricted: true, createdAt: '2026-07-16' },
  { id: 'member-3', firstName: 'محمد', lastName: 'کریمی', mobile: '۰۹۳۵۱۲۳۴۵۶۷', isMinor: false, isRestricted: false, createdAt: '2026-07-18' },
];

const products = [
  { id: 'product-1', title: 'پروتئین شیک شکلاتی', description: 'شیر کم‌چرب، پروتئین وی و موز', categoryId: 'cat-1', inventory: 18, price: 145000, isActive: true },
  { id: 'product-2', title: 'نوشیدنی الکترولیت', description: 'بدون شکر افزوده', categoryId: 'cat-1', inventory: 32, price: 65000, isActive: true },
  { id: 'product-3', title: 'بار پروتئینی', description: '۲۰ گرم پروتئین', categoryId: 'cat-2', inventory: 9, price: 85000, isActive: true },
];

const tickets = [
  { id: 'ticket-1', subject: 'بررسی تمدید عضویت', description: 'پرداخت انجام شده اما تاریخ تمدید نشده است.', status: 'OPEN', priority: 'HIGH', createdAt: '2026-07-18' },
  { id: 'ticket-2', subject: 'پیشنهاد کلاس صبحگاهی', description: 'درخواست افزودن کلاس فانکشنال ساعت ۷ صبح.', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: '2026-07-15' },
];

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function tokenFor(role: string, tenantId: string | null) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(
    JSON.stringify({ sub: `demo-${role.toLowerCase()}`, role, tenantId, exp: Math.floor(Date.now() / 1000) + 86400 }),
  ).replace(/=/g, '');
  return `${header}.${payload}.demo`;
}

function parseBody(body: unknown): Record<string, any> {
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body && typeof body === 'object' ? (body as Record<string, any>) : {};
}

export async function demoRequest(path: string, options: DemoRequestOptions = {}) {
  const method = options.method ?? 'GET';
  const url = new URL(path, 'http://demo.local');
  const pathname = url.pathname;
  const body = parseBody(options.body);

  if (method === 'GET' && pathname === '/tenants') {
    const city = url.searchParams.get('city')?.trim();
    const gender = url.searchParams.get('gender');
    const facility = url.searchParams.get('facilities')?.trim();
    const maxPrice = Number(url.searchParams.get('maxPrice') || 0);
    const minRating = Number(url.searchParams.get('minRating') || 0);
    const result = gyms.filter((gym) => {
      if (city && !gym.city.includes(city)) return false;
      if (gender && gym.genderPolicy && gym.genderPolicy !== gender) return false;
      if (facility && !gym.facilities.some((item) => item.name.includes(facility))) return false;
      if (minRating && gym.trustScore < minRating) return false;
      if (maxPrice && !gym.membershipPlans.some((plan) => plan.price <= maxPrice)) return false;
      return true;
    });
    return json(result);
  }

  if (method === 'GET' && pathname.startsWith('/tenants/') && !pathname.startsWith('/tenants/me/')) {
    const slug = decodeURIComponent(pathname.slice('/tenants/'.length));
    const gym = gyms.find((item) => item.slug === slug);
    return gym ? json(gym) : json({ message: 'باشگاه یافت نشد.' }, 404);
  }

  if (method === 'POST' && pathname === '/auth/login') {
    const account = demoAccounts[String(body.identifier ?? '').trim()];
    if (!account || body.password !== 'demo1234') {
      return json({ message: 'برای ورود دمو، یکی از حساب‌های پیشنهادی و رمز demo1234 را استفاده کنید.' }, 401);
    }
    return json({
      accessToken: tokenFor(account.role, account.tenantId),
      refreshToken: `demo-refresh-${account.role.toLowerCase()}`,
      role: account.role,
      tenantId: account.tenantId,
    });
  }

  if (method === 'POST' && pathname === '/auth/refresh') {
    const role = String(body.refreshToken ?? '').replace('demo-refresh-', '').toUpperCase() || 'ATHLETE';
    const account = Object.values(demoAccounts).find((item) => item.role === role) ?? demoAccounts['09120000002'];
    return json({ accessToken: tokenFor(account.role, account.tenantId), refreshToken: `demo-refresh-${account.role.toLowerCase()}`, role: account.role, tenantId: account.tenantId });
  }

  if (method === 'POST' && pathname === '/auth/register') {
    return json({ message: 'ثبت‌نام آزمایشی انجام شد و درخواست عضویت برای بررسی ارسال شد.' }, 201);
  }

  if (method === 'POST' && pathname === '/auth/logout') return json({ message: 'خروج با موفقیت انجام شد.' });

  if (method === 'GET' && pathname === '/attendance/crowd-status') {
    return json({ activeCount: 37, capacity: 90, level: 'LOW', bestWorkoutTime: '۱۴:۳۰ تا ۱۶:۳۰' });
  }

  if (method === 'GET' && pathname === '/super-admin/overview') {
    return json({ tenantCount: 48, userCount: 12480, activeMemberships: 8360, openTickets: 17 });
  }

  if (method === 'GET' && pathname === '/nutritionists/pending') {
    return json([{ id: 'nutrition-pending-1', user: { firstName: 'نگار', lastName: 'شریفی', tenantId: TENANT_ID } }]);
  }

  if (method === 'GET' && pathname === '/trainers/students') {
    return json(members.slice(0, 2).map((member, index) => ({ id: `student-${index + 1}`, user: member })));
  }

  if (method === 'GET' && pathname === '/trainers/pending') {
    return json([{ id: 'trainer-pending-1', bio: 'مربی بدنسازی با ۶ سال سابقه', specialties: ['بدنسازی', 'کاهش وزن'], user: { firstName: 'رضا', lastName: 'رستمی', mobile: '۰۹۱۲۸۸۸۹۹۰۰' } }]);
  }

  if (method === 'GET' && pathname === '/tenants/me/members') return json(members);
  if (method === 'GET' && pathname === '/cafeteria/products') return json(products);
  if (method === 'GET' && pathname === '/tickets') return json(tickets);
  if (method === 'GET' && pathname === '/tickets/mine') return json(tickets);
  if (method === 'GET' && pathname === '/notifications/mine') {
    return json([
      { id: 'notification-1', title: 'برنامه تمرینی جدید', body: 'مربی شما برنامه هفته آینده را ثبت کرد.', isRead: false },
      { id: 'notification-2', title: 'یادآوری تمدید', body: '۷ روز تا پایان عضویت طلایی شما باقی مانده است.', isRead: false },
    ]);
  }

  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    return json({ id: `demo-${Date.now()}`, ...body, message: 'تغییر در حالت دمو با موفقیت ثبت شد.' }, method === 'POST' ? 201 : 200);
  }

  return json({ message: 'این بخش در داده‌های نمایشی تعریف نشده است.' }, 404);
}
