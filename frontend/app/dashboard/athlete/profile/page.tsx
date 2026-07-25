import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { MembershipCard } from '../../../../components/ui/membership-card';
import { Badge } from '../../../../components/ui/badge';
import { AthleteProfileForm } from '../../../../components/ui/athlete-profile-form';
import { ProfileManager, BasicProfile } from '../../../../components/ui/profile-manager';

interface ProfileData {
  firstName: string; lastName: string; mobile: string; email?: string | null; dateOfBirth: string;
  isMinor: boolean; isRestricted: boolean;
  athleteProfile: Record<string, any> | null;
  insuranceDocs: Array<{ status: string; validUntil?: string | null }>;
  parentalConsent?: { status: string } | null;
}

async function getProfile() {
  const token = (await cookies()).get('accessToken')?.value;
  return api.get<ProfileData>('/athletes/me/profile', { accessToken: token }).catch(() => null);
}

async function getBasicProfile() {
  const token = (await cookies()).get('accessToken')?.value;
  return api.get<BasicProfile>('/profiles/me', { accessToken: token }).catch(() => null);
}

export default async function AthleteProfilePage() {
  const [profile, basicProfile] = await Promise.all([getProfile(), getBasicProfile()]);
  if (!profile) return <MembershipCard className="text-center text-muted">اطلاعات پروفایل در دسترس نیست.</MembershipCard>;
  const insurance = profile.insuranceDocs[0];

  return (
    <div className="flex flex-col gap-6">
      <header><p className="mb-1 text-sm text-accent-soft">پنل ورزشکار</p><h1 className="text-2xl font-extrabold sm:text-3xl">پروفایل شخصی و ورزشی</h1><p className="mt-2 text-sm text-muted">اطلاعات پایه، وضعیت مدارک و داده‌های لازم برای برنامه‌ریزی حرفه‌ای</p></header>
      <div className="grid gap-4 sm:grid-cols-3">
        <MembershipCard><p className="text-sm text-muted">نام و نام خانوادگی</p><p className="mt-2 font-bold">{profile.firstName} {profile.lastName}</p><p className="mt-1 text-xs text-muted">{profile.mobile}</p></MembershipCard>
        <MembershipCard><p className="text-sm text-muted">بیمه ورزشی</p><Badge tone={insurance?.status === 'APPROVED' ? 'success' : 'warning'} className="mt-3">{insurance?.status === 'APPROVED' ? 'تایید‌شده' : 'نیازمند بررسی'}</Badge></MembershipCard>
        <MembershipCard><p className="text-sm text-muted">محدودیت حساب</p><Badge tone={profile.isRestricted ? 'warning' : 'success'} className="mt-3">{profile.isRestricted ? 'محدود' : 'دسترسی کامل'}</Badge></MembershipCard>
      </div>
      {basicProfile && <ProfileManager initial={basicProfile} />}
      <MembershipCard><h2 className="mb-5 text-lg font-bold">اطلاعات ورزشی و پزشکی</h2><AthleteProfileForm initial={profile.athleteProfile ?? {}} /></MembershipCard>
    </div>
  );
}
