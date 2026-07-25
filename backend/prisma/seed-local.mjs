import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_POSTGRES_ADMIN_URL ??
        'postgresql://postgres:postgres_local_dev@localhost:5432/gym_saas?schema=public',
    },
  },
});

const passwordHash = await bcrypt.hash('demo1234', 12);
const tenantId = '11111111-1111-4111-8111-111111111111';
const tenantTwoId = '22222222-2222-4222-8222-222222222222';
const tenantThreeId = '33333333-3333-4333-8333-333333333333';
const planId = '11111111-1111-4111-8111-111111111121';

const tenantDefinitions = [
  {
    id: tenantId,
    slug: 'arman-fit',
    name: 'باشگاه آرمان فیت',
    description: 'مجموعه تخصصی تمرینات قدرتی و تناسب اندام با مربیان تاییدشده و پایش هوشمند پیشرفت.',
    city: 'تهران',
    province: 'تهران',
    county: 'تهران',
    address: 'سعادت‌آباد، بلوار دریا، پلاک ۲۸',
    latitude: 35.777,
    longitude: 51.365,
    phone: '02122110010',
    email: 'hello@armanfit.ir',
    genderPolicy: null,
    trustScore: 94,
    workingHours: { weekdays: '۶:۰۰ تا ۲۳:۰۰', friday: '۸:۰۰ تا ۲۰:۰۰' },
  },
  {
    id: tenantTwoId,
    slug: 'her-power',
    name: 'باشگاه بانوان هِر پاور',
    description: 'باشگاه تخصصی بانوان با کلاس‌های گروهی، پیلاتس، فانکشنال و مشاوره تغذیه.',
    city: 'تهران',
    province: 'تهران',
    county: 'شمیرانات',
    address: 'پاسداران، خیابان گلستان پنجم، پلاک ۱۲',
    latitude: 35.78,
    longitude: 51.46,
    phone: '02122588030',
    email: 'contact@herpower.ir',
    genderPolicy: 'FEMALE',
    trustScore: 91,
    workingHours: { weekdays: '۷:۰۰ تا ۲۲:۰۰', friday: '۹:۰۰ تا ۱۸:۰۰' },
  },
  {
    id: tenantThreeId,
    slug: 'atlas-strength',
    name: 'اطلس استرِنگث',
    description: 'مرکز تمرینات قدرتی و آمادگی جسمانی برای ورزشکاران نیمه‌حرفه‌ای و حرفه‌ای.',
    city: 'کرج',
    province: 'البرز',
    county: 'کرج',
    address: 'جهانشهر، بلوار جمهوری، نبش خیابان بهار',
    latitude: 35.82,
    longitude: 50.97,
    phone: '02632501020',
    email: 'team@atlasstrength.ir',
    genderPolicy: 'MALE',
    trustScore: 88,
    workingHours: { weekdays: '۶:۳۰ تا ۲۳:۳۰', friday: '۸:۰۰ تا ۱۷:۰۰' },
  },
];

for (const tenant of tenantDefinitions) {
  await prisma.tenant.upsert({ where: { id: tenant.id }, create: { ...tenant, isActive: true, isVerified: true }, update: { ...tenant, isActive: true, isVerified: true } });
}

const facilities = [
  ['11111111-1111-4111-8111-111111111131', tenantId, 'پارکینگ'],
  ['11111111-1111-4111-8111-111111111132', tenantId, 'سونا'],
  ['11111111-1111-4111-8111-111111111133', tenantId, 'دوش اختصاصی'],
  ['11111111-1111-4111-8111-111111111134', tenantId, 'بوفه سلامت'],
  ['22222222-2222-4222-8222-222222222231', tenantTwoId, 'پیلاتس'],
  ['22222222-2222-4222-8222-222222222232', tenantTwoId, 'کلاس گروهی'],
  ['22222222-2222-4222-8222-222222222233', tenantTwoId, 'پارکینگ'],
  ['33333333-3333-4333-8333-333333333331', tenantThreeId, 'وزنه آزاد'],
  ['33333333-3333-4333-8333-333333333332', tenantThreeId, 'کراس‌فیت'],
];
for (const [id, tenantIdValue, name] of facilities) {
  await prisma.tenantFacility.upsert({ where: { id }, create: { id, tenantId: tenantIdValue, name }, update: { name } });
}

const plans = [
  { id: planId, tenantId, title: 'عضویت یک‌ماهه', durationDays: 30, price: 1450000 },
  { id: '11111111-1111-4111-8111-111111111122', tenantId, title: 'عضویت طلایی سه‌ماهه', durationDays: 90, price: 3850000 },
  { id: '22222222-2222-4222-8222-222222222221', tenantId: tenantTwoId, title: 'عضویت پایه', durationDays: 30, price: 1200000 },
  { id: '33333333-3333-4333-8333-333333333321', tenantId: tenantThreeId, title: 'عضویت ماهانه', durationDays: 30, price: 980000 },
];
for (const plan of plans) {
  await prisma.membershipPlan.upsert({ where: { id: plan.id }, create: plan, update: plan });
}

const accounts = [
  { id: '00000000-0000-4000-8000-000000000001', tenantId: null, role: 'SUPER_ADMIN', firstName: 'مدیر', lastName: 'ارشد', nationalId: '0010000000', mobile: '09120000000', gender: 'MALE' },
  { id: '00000000-0000-4000-8000-000000000002', tenantId, role: 'GYM_OWNER', firstName: 'رضا', lastName: 'مدیری', nationalId: '0010000001', mobile: '09120000001', gender: 'MALE' },
  { id: '00000000-0000-4000-8000-000000000003', tenantId, role: 'ATHLETE', firstName: 'مریم', lastName: 'اکبری', nationalId: '0010000002', mobile: '09120000002', gender: 'FEMALE' },
  { id: '00000000-0000-4000-8000-000000000004', tenantId, role: 'TRAINER', firstName: 'علی', lastName: 'رضایی', nationalId: '0010000003', mobile: '09120000003', gender: 'MALE' },
  { id: '00000000-0000-4000-8000-000000000005', tenantId, role: 'NUTRITIONIST', firstName: 'سارا', lastName: 'احمدی', nationalId: '0010000004', mobile: '09120000004', gender: 'FEMALE' },
  { id: '00000000-0000-4000-8000-000000000006', tenantId, role: 'RECEPTION', firstName: 'نگین', lastName: 'پذیرش', nationalId: '0010000005', mobile: '09120000005', gender: 'FEMALE' },
  { id: '00000000-0000-4000-8000-000000000007', tenantId, role: 'ATHLETE', firstName: 'محمد', lastName: 'کریمی', nationalId: '0010000006', mobile: '09350000006', gender: 'MALE' },
  { id: '00000000-0000-4000-8000-000000000008', tenantId, role: 'ATHLETE', firstName: 'امیرعلی', lastName: 'نجفی', nationalId: '0010000007', mobile: '09190000007', gender: 'MALE' },
  { id: '00000000-0000-4000-8000-000000000009', tenantId, role: 'ATHLETE', firstName: 'نیلوفر', lastName: 'موسوی', nationalId: '0010000008', mobile: '09120000008', gender: 'FEMALE' },
  { id: '00000000-0000-4000-8000-000000000010', tenantId, role: 'BUFFET_STAFF', firstName: 'نوید', lastName: 'بوفه', nationalId: '0010000009', mobile: '09120000009', gender: 'MALE' },
];
for (const account of accounts) {
  await prisma.user.upsert({
    where: { id: account.id },
    create: { ...account, passwordHash, dateOfBirth: new Date('1995-01-01'), isActive: true, isMinor: false, isRestricted: false, city: 'تهران' },
    update: { ...account, passwordHash, isActive: true },
  });
}

const athleteUserId = accounts[2].id;
const trainerUserId = accounts[3].id;
const nutritionistUserId = accounts[4].id;
const athlete = await prisma.athleteProfile.upsert({
  where: { userId: athleteUserId },
  create: { userId: athleteUserId, heightCm: 168, weightKg: 64.8, fitnessGoal: 'FAT_LOSS', trainingLevel: 'INTERMEDIATE', activityLevel: 'moderate' },
  update: { heightCm: 168, weightKg: 64.8, fitnessGoal: 'FAT_LOSS', trainingLevel: 'INTERMEDIATE', activityLevel: 'moderate' },
});
const trainerProfile = await prisma.trainerProfile.upsert({
  where: { userId: trainerUserId },
  create: { userId: trainerUserId, bio: 'مربی تخصصی تناسب اندام و اصلاح فرم', specialties: ['بدنسازی', 'کاهش وزن'], status: 'APPROVED', approvedAt: new Date() },
  update: { bio: 'مربی تخصصی تناسب اندام و اصلاح فرم', specialties: ['بدنسازی', 'کاهش وزن'], status: 'APPROVED' },
});
const nutritionistProfile = await prisma.nutritionistProfile.upsert({
  where: { userId: nutritionistUserId },
  create: { userId: nutritionistUserId, bio: 'متخصص تغذیه ورزشی', nationalIdDocUrl: 'http://localhost/demo/national-id.pdf', certificateUrl: 'http://localhost/demo/certificate.pdf', status: 'APPROVED', approvedAt: new Date() },
  update: { bio: 'متخصص تغذیه ورزشی', status: 'APPROVED' },
});

await prisma.insuranceDocument.upsert({
  where: { id: '11111111-1111-4111-8111-111111111141' },
  create: { id: '11111111-1111-4111-8111-111111111141', userId: athleteUserId, documentUrl: 'http://localhost/demo/insurance.pdf', provider: 'فدراسیون پزشکی ورزشی', status: 'APPROVED', reviewedAt: new Date(), validUntil: new Date('2027-12-30') },
  update: { status: 'APPROVED', validUntil: new Date('2027-12-30') },
});

const startDate = new Date();
const endDate = new Date(startDate);
endDate.setDate(endDate.getDate() + 30);
await prisma.membership.upsert({
  where: { id: '11111111-1111-4111-8111-111111111151' },
  create: { id: '11111111-1111-4111-8111-111111111151', tenantId, userId: athleteUserId, planId, status: 'ACTIVE', startDate, endDate },
  update: { status: 'ACTIVE', startDate, endDate },
});
for (const [index, extraUser] of accounts.filter((account) => account.role === 'ATHLETE' && account.id !== athleteUserId).entries()) {
  const profile = await prisma.athleteProfile.upsert({ where: { userId: extraUser.id }, create: { userId: extraUser.id, trainingLevel: 'BEGINNER', fitnessGoal: 'GENERAL_FITNESS' }, update: {} });
  const insuranceStatus = index === 2 ? 'PENDING' : 'APPROVED';
  const membershipStatus = index === 2 ? 'PENDING_INSURANCE' : index === 1 ? 'PENDING_PAYMENT' : 'ACTIVE';
  await prisma.insuranceDocument.upsert({
    where: { id: `11111111-1111-4111-8111-11111111114${index + 2}` },
    create: { id: `11111111-1111-4111-8111-11111111114${index + 2}`, userId: extraUser.id, documentUrl: 'http://localhost/demo/insurance.pdf', provider: 'بیمه ورزشی فدراسیون', status: insuranceStatus, validUntil: new Date('2027-12-30') },
    update: { status: insuranceStatus, provider: 'بیمه ورزشی فدراسیون' },
  });
  await prisma.membership.upsert({
    where: { id: `11111111-1111-4111-8111-11111111115${index + 2}` },
    create: { id: `11111111-1111-4111-8111-11111111115${index + 2}`, tenantId, userId: extraUser.id, planId, status: membershipStatus, startDate: membershipStatus === 'ACTIVE' ? startDate : null, endDate: membershipStatus === 'ACTIVE' ? endDate : null },
    update: { status: membershipStatus, startDate: membershipStatus === 'ACTIVE' ? startDate : null, endDate: membershipStatus === 'ACTIVE' ? endDate : null },
  });
  void profile;
}
await prisma.bodyMeasurement.upsert({
  where: { id: '11111111-1111-4111-8111-111111111161' },
  create: { id: '11111111-1111-4111-8111-111111111161', athleteId: athlete.id, weightKg: 64.8, waistCm: 76, bodyFatPercent: 21.2 },
  update: { weightKg: 64.8, waistCm: 76, bodyFatPercent: 21.2 },
});
for (const item of [
  { id: '11111111-1111-4111-8111-111111111162', daysAgo: 28, weightKg: 67.2, waistCm: 79, bodyFatPercent: 22.8 },
  { id: '11111111-1111-4111-8111-111111111163', daysAgo: 18, weightKg: 66.3, waistCm: 78, bodyFatPercent: 22.1 },
  { id: '11111111-1111-4111-8111-111111111164', daysAgo: 8, weightKg: 65.4, waistCm: 77, bodyFatPercent: 21.7 },
]) {
  const recordedAt = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);
  await prisma.bodyMeasurement.upsert({
    where: { id: item.id },
    create: { id: item.id, athleteId: athlete.id, weightKg: item.weightKg, waistCm: item.waistCm, bodyFatPercent: item.bodyFatPercent, recordedAt },
    update: { weightKg: item.weightKg, waistCm: item.waistCm, bodyFatPercent: item.bodyFatPercent, recordedAt },
  });
}
await prisma.goal.upsert({
  where: { id: '11111111-1111-4111-8111-111111111171' },
  create: { id: '11111111-1111-4111-8111-111111111171', athleteId: athlete.id, type: 'FAT_LOSS', targetValue: 60, targetDate: new Date('2026-10-01') },
  update: { targetValue: 60, achieved: false },
});

await prisma.trainerStudent.upsert({
  where: { trainerId_athleteId: { trainerId: trainerProfile.id, athleteId: athlete.id } },
  create: { trainerId: trainerProfile.id, athleteId: athlete.id, userId: athleteUserId },
  update: { userId: athleteUserId, isActive: true, endedAt: null },
});
await prisma.nutritionistClient.upsert({
  where: { nutritionistId_athleteId: { nutritionistId: nutritionistProfile.id, athleteId: athlete.id } },
  create: { nutritionistId: nutritionistProfile.id, athleteId: athlete.id, userId: athleteUserId },
  update: { userId: athleteUserId, isActive: true, endedAt: null },
});

await prisma.trainingProgram.upsert({
  where: { id: '11111111-1111-4111-8111-111111111181' },
  create: {
    id: '11111111-1111-4111-8111-111111111181',
    tenantId,
    trainerId: trainerProfile.id,
    athleteId: athlete.id,
    title: 'کاهش چربی و افزایش استقامت · هفته سوم',
    goal: 'FAT_LOSS',
    status: 'ACTIVE',
    startDate: new Date('2026-07-01'),
    sessions: {
      create: [
        { dayOfWeek: 0, title: 'بالاتنه', exercises: { create: [{ name: 'پرس سینه دمبل', sets: 4, reps: '۱۰-۱۲', restSeconds: 75 }, { name: 'زیربغل سیم‌کش', sets: 4, reps: '۱۰-۱۲', restSeconds: 75, sortOrder: 1 }] } },
        { dayOfWeek: 2, title: 'پایین‌تنه', exercises: { create: [{ name: 'اسکوات', sets: 4, reps: '۸-۱۰', restSeconds: 90 }, { name: 'لانج راه‌رفتنی', sets: 3, reps: '۱۲ هر پا', restSeconds: 60, sortOrder: 1 }] } },
      ],
    },
  },
  update: { title: 'کاهش چربی و افزایش استقامت · هفته سوم', status: 'ACTIVE' },
});

await prisma.dietPlan.upsert({
  where: { id: '11111111-1111-4111-8111-111111111191' },
  create: {
    id: '11111111-1111-4111-8111-111111111191',
    tenantId,
    nutritionistId: nutritionistProfile.id,
    athleteId: athlete.id,
    title: 'رژیم متعادل کاهش چربی',
    goal: 'FAT_LOSS',
    dailyCalories: 1800,
    status: 'ACTIVE',
    startDate: new Date('2026-07-01'),
    meals: {
      create: [
        { mealTime: 'صبحانه', description: 'املت سبزیجات، نان کامل و چای', calories: 420 },
        { mealTime: 'ناهار', description: 'مرغ گریل، برنج قهوه‌ای و سالاد', calories: 610, sortOrder: 1 },
        { mealTime: 'شام', description: 'ماهی و سبزیجات بخارپز', calories: 480, sortOrder: 2 },
      ],
    },
  },
  update: { title: 'رژیم متعادل کاهش چربی', dailyCalories: 1800, status: 'ACTIVE' },
});

await prisma.payment.upsert({
  where: { id: '11111111-1111-4111-8111-111111111201' },
  create: { id: '11111111-1111-4111-8111-111111111201', tenantId, userId: athleteUserId, membershipId: '11111111-1111-4111-8111-111111111151', amount: 1450000, method: 'ONLINE_GATEWAY', status: 'SUCCEEDED', gatewayRef: 'LOCAL-DEMO-1001', paidAt: new Date() },
  update: { status: 'SUCCEEDED', paidAt: new Date() },
});

await prisma.attendance.updateMany({
  where: { userId: { in: [accounts[7].id, accounts[8].id] }, checkOutAt: null },
  data: { checkOutAt: new Date() },
});
for (const [index, user] of [accounts[2], accounts[6]].entries()) {
  await prisma.attendance.upsert({
    where: { id: `11111111-1111-4111-8111-11111111121${index + 1}` },
    create: { id: `11111111-1111-4111-8111-11111111121${index + 1}`, tenantId, userId: user.id, method: index === 0 ? 'QR_CODE' : 'MEMBERSHIP_CARD', checkInAt: new Date(Date.now() - (index + 1) * 18 * 60 * 1000) },
    update: { checkOutAt: null },
  });
}
for (const [index, daysAgo] of [3, 7, 11, 16, 22].entries()) {
  const checkInAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  checkInAt.setHours(17, 30, 0, 0);
  const checkOutAt = new Date(checkInAt.getTime() + 75 * 60 * 1000);
  await prisma.attendance.upsert({
    where: { id: `11111111-1111-4111-8111-11111111125${index + 1}` },
    create: { id: `11111111-1111-4111-8111-11111111125${index + 1}`, tenantId, userId: athleteUserId, method: 'QR_CODE', checkInAt, checkOutAt },
    update: { checkInAt, checkOutAt },
  });
}

await prisma.ticket.upsert({
  where: { id: '11111111-1111-4111-8111-111111111221' },
  create: { id: '11111111-1111-4111-8111-111111111221', tenantId, createdById: athleteUserId, targetType: 'GYM', targetId: tenantId, subject: 'بررسی تمدید عضویت', description: 'پرداخت انجام شده و درخواست بررسی وضعیت تمدید را دارم.', status: 'OPEN', priority: 'HIGH' },
  update: { status: 'OPEN', priority: 'HIGH' },
});

await prisma.message.upsert({
  where: { id: '11111111-1111-4111-8111-111111111261' },
  create: { id: '11111111-1111-4111-8111-111111111261', tenantId, senderId: trainerUserId, recipientId: athleteUserId, conversationId: [trainerUserId, athleteUserId].sort().join('--'), body: 'سلام مریم، برنامه هفته سوم آماده است. بعد از هر جلسه وضعیتت را برایم بفرست.' },
  update: {},
});
await prisma.message.upsert({
  where: { id: '11111111-1111-4111-8111-111111111262' },
  create: { id: '11111111-1111-4111-8111-111111111262', tenantId, senderId: athleteUserId, recipientId: trainerUserId, conversationId: [trainerUserId, athleteUserId].sort().join('--'), body: 'حتماً مربی، جلسه اول خیلی خوب بود.' },
  update: {},
});
await prisma.message.upsert({
  where: { id: '11111111-1111-4111-8111-111111111263' },
  create: { id: '11111111-1111-4111-8111-111111111263', tenantId, senderId: nutritionistUserId, recipientId: athleteUserId, conversationId: [nutritionistUserId, athleteUserId].sort().join('--'), body: 'رژیم جدیدت ثبت شد؛ مصرف آب روزانه را فراموش نکن.' },
  update: {},
});

await prisma.notification.upsert({
  where: { id: '11111111-1111-4111-8111-111111111271' },
  create: { id: '11111111-1111-4111-8111-111111111271', tenantId, userId: athleteUserId, title: 'برنامه تمرینی جدید', body: 'برنامه هفته سوم توسط مربی علی رضایی ثبت شد.', channel: 'IN_APP' },
  update: {},
});
await prisma.notification.upsert({
  where: { id: '11111111-1111-4111-8111-111111111272' },
  create: { id: '11111111-1111-4111-8111-111111111272', tenantId, userId: athleteUserId, title: 'یادآوری تمدید عضویت', body: 'از عضویت فعلی شما ۳۰ روز باقی مانده است.', channel: 'IN_APP' },
  update: {},
});
await prisma.ticket.upsert({
  where: { id: '11111111-1111-4111-8111-111111111222' },
  create: { id: '11111111-1111-4111-8111-111111111222', tenantId, createdById: accounts[6].id, targetType: 'GYM', targetId: tenantId, subject: 'پیشنهاد کلاس صبحگاهی', description: 'لطفاً کلاس فانکشنال ساعت هفت صبح اضافه شود.', status: 'IN_PROGRESS', priority: 'MEDIUM' },
  update: { status: 'IN_PROGRESS' },
});

const category = await prisma.productCategory.upsert({
  where: { id: '11111111-1111-4111-8111-111111111231' },
  create: { id: '11111111-1111-4111-8111-111111111231', tenantId, name: 'نوشیدنی و مکمل' },
  update: { name: 'نوشیدنی و مکمل' },
});
const productDefinitions = [
  { id: '11111111-1111-4111-8111-111111111241', title: 'پروتئین شیک شکلاتی', description: 'شیر کم‌چرب، پروتئین وی و موز', inventory: 18, price: 145000 },
  { id: '11111111-1111-4111-8111-111111111242', title: 'نوشیدنی الکترولیت', description: 'بدون شکر افزوده', inventory: 32, price: 65000 },
  { id: '11111111-1111-4111-8111-111111111243', title: 'بار پروتئینی', description: '۲۰ گرم پروتئین', inventory: 9, price: 85000 },
];
for (const product of productDefinitions) {
  await prisma.cafeteriaProduct.upsert({ where: { id: product.id }, create: { ...product, tenantId, categoryId: category.id, isActive: true }, update: { ...product, isActive: true } });
}

const buffetOrderId = '11111111-1111-4111-8111-111111111281';
await prisma.order.upsert({
  where: { id: buffetOrderId },
  create: {
    id: buffetOrderId,
    tenantId,
    userId: athleteUserId,
    status: 'PLACED',
    totalAmount: 210000,
    items: { create: [
      { productId: productDefinitions[0].id, quantity: 1, unitPrice: productDefinitions[0].price },
      { productId: productDefinitions[1].id, quantity: 1, unitPrice: productDefinitions[1].price },
    ] },
  },
  update: { status: 'PLACED', totalAmount: 210000 },
});

await prisma.advertisement.upsert({
  where: { id: '11111111-1111-4111-8111-111111111291' },
  create: {
    id: '11111111-1111-4111-8111-111111111291',
    tenantId,
    title: 'یک جلسه تمرین مهمان رایگان در آرمان فیت',
    description: 'ویژه کاربران جدید تهران؛ همراه با ارزیابی اولیه مربی.',
    province: 'تهران',
    city: 'تهران',
    status: 'APPROVED',
    startsAt: new Date(),
    endsAt: new Date('2027-12-30'),
    dailyBudget: 350000,
    destinationUrl: '/gyms/arman-fit',
  },
  update: { status: 'APPROVED', endsAt: new Date('2027-12-30'), dailyBudget: 350000 },
});

const subscriptionPlans = [
  { id: '90000000-0000-4000-8000-000000000001', code: 'STARTER', name: 'شروع', monthlyPrice: 990000, features: ['اعضا و حضور و غیاب', 'پنل بوفه', 'پشتیبانی پایه'] },
  { id: '90000000-0000-4000-8000-000000000002', code: 'GROWTH', name: 'رشد', monthlyPrice: 2490000, features: ['همه امکانات شروع', 'تبلیغات شهری', 'اتصال دستگاه تردد', 'گزارش‌های مالی'] },
  { id: '90000000-0000-4000-8000-000000000003', code: 'ENTERPRISE', name: 'سازمانی', monthlyPrice: 5990000, features: ['چند شعبه', 'API اختصاصی', 'پشتیبانی ویژه', 'یکپارچه‌سازی سفارشی'] },
];
for (const plan of subscriptionPlans) {
  await prisma.subscriptionPlan.upsert({ where: { code: plan.code }, create: plan, update: plan });
}
await prisma.tenantSubscription.upsert({
  where: { tenantId },
  create: { tenantId, planId: subscriptionPlans[1].id, status: 'ACTIVE', renewsAt: new Date('2026-08-19') },
  update: { planId: subscriptionPlans[1].id, status: 'ACTIVE', renewsAt: new Date('2026-08-19') },
});

const integrations = [
  { key: 'SMS', label: 'سامانه پیامکی', category: 'COMMUNICATION', provider: 'قابل انتخاب', requiredEnvVars: ['SMS_API_KEY', 'SMS_SENDER'] },
  { key: 'SPORTS_INSURANCE', label: 'بیمه ورزشی', category: 'GOVERNMENT', provider: 'فدراسیون پزشکی ورزشی', requiredEnvVars: ['SPORTS_INSURANCE_API_KEY'] },
  { key: 'TAX', label: 'سامانه مودیان مالیاتی', category: 'GOVERNMENT', provider: 'سازمان امور مالیاتی', requiredEnvVars: ['TAX_CLIENT_ID', 'TAX_PRIVATE_KEY_PATH'] },
  { key: 'NESHAN_MAPS', label: 'نقشه نشان', category: 'MAPS', provider: 'نشان', requiredEnvVars: ['NESHAN_API_KEY'] },
  { key: 'GOOGLE_MAPS', label: 'Google Maps', category: 'MAPS', provider: 'Google', requiredEnvVars: ['GOOGLE_MAPS_API_KEY'] },
  { key: 'PAYMENT_GATEWAY', label: 'درگاه پرداخت', category: 'PAYMENT', provider: 'قابل انتخاب', requiredEnvVars: ['PAYMENT_MERCHANT_ID', 'PAYMENT_CALLBACK_URL'] },
];
for (const integration of integrations) {
  await prisma.platformIntegration.upsert({
    where: { key: integration.key },
    create: { ...integration, status: 'NOT_CONFIGURED' },
    update: { ...integration },
  });
}

const demoDeviceKey = 'gym_demo_device_key_2026';
await prisma.attendanceDevice.upsert({
  where: { id: '11111111-1111-4111-8111-111111111301' },
  create: {
    id: '11111111-1111-4111-8111-111111111301', tenantId, name: 'گیت ورودی اصلی',
    type: 'CARD', vendor: 'نسخه نمایشی', model: 'Gate One', serialNumber: 'LOCAL-001',
    apiKeyDigest: createHash('sha256').update(demoDeviceKey).digest('hex'), apiKeyLast4: demoDeviceKey.slice(-4), status: 'CONNECTED', lastSeenAt: new Date(),
  },
  update: { status: 'CONNECTED', lastSeenAt: new Date() },
});
await prisma.attendanceCredential.upsert({
  where: { tenantId_type_identifierHash: { tenantId, type: 'CARD', identifierHash: createHash('sha256').update('CARD:ARMAN-1001').digest('hex') } },
  create: { tenantId, userId: athleteUserId, type: 'CARD', identifierHash: createHash('sha256').update('CARD:ARMAN-1001').digest('hex'), identifierLast4: '1001', label: 'کارت عضویت مریم' },
  update: { userId: athleteUserId, isActive: true },
});

await prisma.financialAccount.upsert({
  where: { id: '11111111-1111-4111-8111-111111111311' },
  create: { id: '11111111-1111-4111-8111-111111111311', tenantId, userId: accounts[1].id, scope: 'GYM', label: 'حساب تسویه اصلی باشگاه', bankName: 'بانک ملت', accountHolder: 'باشگاه آرمان فیت', iban: 'IR120170000000123456789012', accountNumber: '1234567890', cardLast4: '3912', isDefault: true },
  update: { iban: 'IR120170000000123456789012', cardLast4: '3912', isDefault: true },
});

await prisma.heroSlide.upsert({
  where: { id: '80000000-0000-4000-8000-000000000001' },
  create: {
    id: '80000000-0000-4000-8000-000000000001',
    eyebrow: 'قدرت از یک تصمیم شروع می‌شود',
    title: 'قهرمان خودت باش',
    subtitle: 'باشگاه مناسب، مربی حرفه‌ای و مسیر پیشرفتت را یک‌جا پیدا کن.',
    imageUrl: 'https://images.pexels.com/photos/32085332/pexels-photo-32085332.jpeg?cs=srgb&fm=jpg&w=1920&h=1080&fit=crop',
    imageCredit: 'Photo by foad shariyati on Pexels',
    ctaLabel: 'شروع به‌عنوان ورزشکار',
    ctaUrl: '/access/athlete',
    sortOrder: 0,
    isActive: true,
  },
  update: {
    eyebrow: 'قدرت از یک تصمیم شروع می‌شود',
    title: 'قهرمان خودت باش',
    subtitle: 'باشگاه مناسب، مربی حرفه‌ای و مسیر پیشرفتت را یک‌جا پیدا کن.',
    imageUrl: 'https://images.pexels.com/photos/32085332/pexels-photo-32085332.jpeg?cs=srgb&fm=jpg&w=1920&h=1080&fit=crop',
    imageCredit: 'Photo by foad shariyati on Pexels',
    ctaLabel: 'شروع به‌عنوان ورزشکار',
    ctaUrl: '/access/athlete',
    sortOrder: 0,
    isActive: true,
  },
});

const platformProfessionals = [
  {
    id: '80000000-0000-4000-8000-000000000011',
    type: 'TRAINER',
    fullName: 'آریا فرهمند',
    bio: 'مربی بدنسازی و آمادگی جسمانی با تمرکز بر طراحی برنامه آنلاین و پایش پیشرفت.',
    specialties: ['بدنسازی', 'آمادگی جسمانی', 'برنامه تمرینی آنلاین'],
    province: 'تهران',
    city: 'تهران',
    serviceMode: 'HYBRID',
    consultationFee: 780000,
    rating: 4.8,
    isFeatured: true,
    isActive: true,
  },
  {
    id: '80000000-0000-4000-8000-000000000012',
    type: 'NUTRITIONIST',
    fullName: 'نازنین پارسا',
    bio: 'متخصص تغذیه ورزشی برای کاهش چربی، افزایش توده عضلانی و اصلاح عادت‌های غذایی.',
    specialties: ['تغذیه ورزشی', 'کاهش چربی', 'افزایش حجم'],
    province: 'فارس',
    city: 'شیراز',
    serviceMode: 'ONLINE',
    consultationFee: 650000,
    rating: 4.9,
    isFeatured: true,
    isActive: true,
  },
];
for (const professional of platformProfessionals) {
  await prisma.platformProfessional.upsert({
    where: { id: professional.id },
    create: professional,
    update: professional,
  });
}

console.log('LOCAL_SEED_READY=10 demo accounts, 3 gyms, staff, experts, hero + platform operations');
await prisma.$disconnect();
