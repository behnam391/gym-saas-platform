import { DashboardSection } from '../../../../components/ui/dashboard-section';

export default async function OwnerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <DashboardSection role="gym-owner" section={section} />;
}

