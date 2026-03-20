import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserByAuthId } from '@/lib/services/users';
import { getUnreadCount } from '@/lib/services/notifications';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import type { Locale } from '@/i18n/config';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    redirect('/login');
  }

  // Parallel fetch — user + locale + unread count
  const [user, locale] = await Promise.all([
    getUserByAuthId(session.user.id),
    getLocale() as Promise<string>,
  ]);

  if (!user) redirect('/login');

  // Unread count can be non-blocking
  const unreadCount = await getUnreadCount(user.id);

  return (
    <div className="flex h-screen">
      <Sidebar userRole={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={user.fullName}
          userRole={user.role}
          locale={locale as Locale}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
