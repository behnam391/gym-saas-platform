import { DashboardSection } from '../../../../components/ui/dashboard-section';

export default async function ReceptionSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <DashboardSection role="reception" section={section} />;
}

