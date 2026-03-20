import { getTranslations } from 'next-intl/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, CreditCard, User } from 'lucide-react';
import Link from 'next/link';

export default async function ParentDashboard() {
  const t = await getTranslations('Dashboard');
  const session = await requireAuth();
  await requireRole(session, ['PARENT']);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('parentDashboard')}</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">{t('childStatus')}</p>
                <p className="text-lg font-medium">View Ward&apos;s Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/dashboard/parent/leave">
          <Card className="cursor-pointer hover:border-blue-300">
            <CardContent>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-500">{t('leaveRequests')}</p>
                  <p className="text-lg font-medium">View Leave Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">{t('feeStatus')}</p>
                <p className="text-lg font-medium">View Fee Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
