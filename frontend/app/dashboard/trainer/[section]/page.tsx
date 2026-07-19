import { DashboardSection } from '../../../../components/ui/dashboard-section';

export default async function TrainerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <DashboardSection role="trainer" section={section} />;
}

