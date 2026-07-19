import { DashboardSection } from '../../../../components/ui/dashboard-section';

export default async function AthleteSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <DashboardSection role="athlete" section={section} />;
}

