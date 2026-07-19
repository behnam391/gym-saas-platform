import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { PendingTrainersList } from '../../../../components/ui/pending-trainers-list';

interface TrainerApplication {
  id: string;
  bio: string | null;
  specialties: string[];
  certificateUrl: string;
  user: { firstName: string; lastName: string; mobile: string };
}

async function getPending(): Promise<TrainerApplication[]> {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    return await api.get<TrainerApplication[]>('/trainers/pending', { accessToken: token });
  } catch {
    return [];
  }
}

export default async function GymOwnerTrainersPage() {
  const pending = await getPending();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">تایید مربیان</h1>
        <p className="text-muted">بررسی مدارک و تایید درخواست‌های فعالیت مربیان جدید</p>
      </header>
      <PendingTrainersList initial={pending} />
    </div>
  );
}
