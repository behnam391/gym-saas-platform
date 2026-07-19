import { DashboardSection } from '../../../../components/ui/dashboard-section';

export default async function SuperAdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <DashboardSection role="super-admin" section={section} />;
}

