import { cookies } from 'next/headers';
import { AdminPanel } from '@/components/admin-panel';
import { PinLogin } from '@/components/pin-login';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authenticated = await verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  return authenticated ? <AdminPanel /> : <PinLogin />;
}
