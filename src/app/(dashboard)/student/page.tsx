import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getUserByAuthId } from '@/lib/services/users';
import { getPaymentSummary } from '@/lib/services/payments';
import { getStudentAllocation } from '@/lib/services/rooms';
import { getUnreadCount } from '@/lib/services/notifications';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { CreditCard, CalendarDays, FolderOpen, DoorOpen } from 'lucide-react';

export default async function StudentDashboard() {
  const t = await getTranslations('Dashboard');
  const session = await requireAuth();
  const user = await getUserByAuthId(session.user.id);

  const [payments, allocation, unread] = await Promise.all([
    getPaymentSummary(session.user.id),
    getStudentAllocation(session.user.id),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('welcome')}, {user?.fullName}</h1>
        <p className="text-gray-500">{t('studentDashboard')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">{t('pendingFees')}</p>
                <p className="text-2xl font-bold">₹{payments.totalPending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <DoorOpen className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">{t('room')}</p>
                <p className="text-2xl font-bold">{allocation ? 'Allocated' : 'None'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm text-gray-500">{t('overdueFees')}</p>
                <p className="text-2xl font-bold">{payments.overdueFees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">{t('notifications')}</p>
                <p className="text-2xl font-bold">{unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>{t('quickActions')}</CardTitle>
          <CardContent className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/dashboard/student/fees" className="rounded-lg border p-4 text-center hover:bg-gray-50">
              <CreditCard className="mx-auto h-6 w-6 text-blue-600" />
              <span className="mt-2 block text-sm font-medium">{t('payFees')}</span>
            </Link>
            <Link href="/dashboard/student/leave" className="rounded-lg border p-4 text-center hover:bg-gray-50">
              <CalendarDays className="mx-auto h-6 w-6 text-amber-600" />
              <span className="mt-2 block text-sm font-medium">{t('applyLeave')}</span>
            </Link>
            <Link href="/dashboard/student/documents" className="rounded-lg border p-4 text-center hover:bg-gray-50">
              <FolderOpen className="mx-auto h-6 w-6 text-purple-600" />
              <span className="mt-2 block text-sm font-medium">{t('documents')}</span>
            </Link>
            <Link href="/dashboard/student/room" className="rounded-lg border p-4 text-center hover:bg-gray-50">
              <DoorOpen className="mx-auto h-6 w-6 text-green-600" />
              <span className="mt-2 block text-sm font-medium">{t('roomDetails')}</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
