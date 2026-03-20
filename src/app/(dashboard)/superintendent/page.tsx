import { getTranslations } from 'next-intl/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { getApplicationStats } from '@/lib/services/applications';
import { getLeaveStats } from '@/lib/services/leaves';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CalendarDays, DoorOpen, Users } from 'lucide-react';

export default async function SuperintendentDashboard() {
  const t = await getTranslations('Dashboard');
  const session = await requireAuth();
  const { role, vertical } = await requireRole(session, ['SUPERINTENDENT']);

  const [appStats, leaveStats] = await Promise.all([
    getApplicationStats(role, vertical),
    getLeaveStats(vertical),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('superintendentDashboard')}</h1>
        <p className="text-gray-500">{vertical} vertical</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">{t('pendingApplications')}</p>
                <p className="text-2xl font-bold">{appStats.SUBMITTED ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm text-gray-500">{t('pendingLeaves')}</p>
                <p className="text-2xl font-bold">{leaveStats.PENDING ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">{t('inReview')}</p>
                <p className="text-2xl font-bold">{appStats.REVIEW ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <DoorOpen className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">{t('approved')}</p>
                <p className="text-2xl font-bold">{appStats.APPROVED ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
