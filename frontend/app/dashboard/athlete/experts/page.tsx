import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { AthleteExpertsDirectory } from '../../../../components/ui/athlete-experts-directory';
import { PlatformProfessional } from '../../../../components/ui/platform-professionals-manager';

export default async function AthleteExpertsPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const [professionals, requests] = await Promise.all([
    api.get<PlatformProfessional[]>('/platform-professionals').catch(() => []),
    api.get<any[]>('/platform-professionals/mine', { accessToken: token }).catch(() => []),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">مربی و مشاور سراسری</h1><p className="mt-1 text-muted">متخصصان تأییدشده را مقایسه و درخواست مشاوره ثبت کنید</p></header>
      <AthleteExpertsDirectory initial={professionals} requests={requests} />
    </div>
  );
}
