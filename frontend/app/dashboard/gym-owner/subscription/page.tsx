import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import {
  PlatformSubscriptionData,
  PlatformSubscriptionPanel,
} from '../../../../components/ui/platform-subscription-panel';

export default async function PlatformSubscriptionPage() {
  const token = (await cookies()).get('accessToken')?.value;
  const data = await api.get<PlatformSubscriptionData>(
    '/payments/platform-subscription',
    { accessToken: token },
  );

  return <PlatformSubscriptionPanel initial={data} />;
}
