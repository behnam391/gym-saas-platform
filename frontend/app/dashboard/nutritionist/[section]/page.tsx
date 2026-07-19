import { DashboardSection } from '../../../../components/ui/dashboard-section';

export default async function NutritionistSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <DashboardSection role="nutritionist" section={section} />;
}

