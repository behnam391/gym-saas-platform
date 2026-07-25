import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import {
  OnboardingApplication,
  OnboardingApplicationsManager,
} from '../../../../components/ui/onboarding-applications-manager';

export default async function OnboardingApplicationsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const applications = await api.get<OnboardingApplication[]>('/onboarding/applications', { accessToken: token });
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">درخواست‌های ثبت‌نام و همکاری</h1><p className="mt-1 text-muted">بررسی درخواست صاحبان باشگاه، مربیان و متخصصان تغذیه پیش از ساخت حساب</p></header>
      <OnboardingApplicationsManager initial={applications} />
    </div>
  );
}
