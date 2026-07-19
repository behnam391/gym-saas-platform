import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
await prisma.trainerProfile.upsert({
  where: { userId: trainerUserId },
  create: { userId: trainerUserId, bio: 'مربی تخصصی تناسب اندام و اصلاح فرم', specialties: ['بدنسازی', 'کاهش وزن'], status: 'APPROVED', approvedAt: new Date() },
  update: { bio: 'مربی تخصصی تناسب اندام و اصلاح فرم', specialties: ['بدنسازی', 'کاهش وزن'], status: 'APPROVED' },
});
await prisma.nutritionistProfile.upsert({
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
await prisma.bodyMeasurement.upsert({
  where: { id: '11111111-1111-4111-8111-111111111161' },
  create: { id: '11111111-1111-4111-8111-111111111161', athleteId: athlete.id, weightKg: 64.8, waistCm: 76, bodyFatPercent: 21.2 },
  update: { weightKg: 64.8, waistCm: 76, bodyFatPercent: 21.2 },
});
await prisma.goal.upsert({
  where: { id: '11111111-1111-4111-8111-111111111171' },
  create: { id: '11111111-1111-4111-8111-111111111171', athleteId: athlete.id, type: 'FAT_LOSS', targetValue: 60, targetDate: new Date('2026-10-01') },
  update: { targetValue: 60, achieved: false },
});

console.log('LOCAL_SEED_READY=6 demo accounts, 3 gyms');
await prisma.$disconnect();

