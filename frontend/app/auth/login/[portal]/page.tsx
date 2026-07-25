import { notFound } from 'next/navigation';
import { PortalLoginForm } from '../../../../components/ui/portal-login-form';
import { isLoginPortal } from '../../../../lib/login-portals';

export default async function RoleLoginPage({ params }: { params: Promise<{ portal: string }> }) {
  const { portal } = await params;
  if (!isLoginPortal(portal)) notFound();
  return <PortalLoginForm portal={portal} />;
}
