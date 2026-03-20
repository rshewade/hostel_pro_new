import { getTranslations } from 'next-intl/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { getApplicationStats } from '@/lib/services/applications';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ClipboardCheck, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default async function TrusteeDashboard() {
  const t = await getTranslations('Dashboard');
  const session = await requireAuth();
  const { role } = await requireRole(session, ['TRUSTEE']);

  const stats = await getApplicationStats(role);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('trusteeDashboard')}</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">{t('totalApplications')}</p>
                <p className="text-2xl font-bold">{Object.values(stats).reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/dashboard/trustee/applications">
          <Card className="cursor-pointer hover:border-blue-300">
            <CardContent>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-500">{t('pendingReview')}</p>
                  <p className="text-2xl font-bold">{(stats.SUBMITTED ?? 0) + (stats.REVIEW ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/trustee/interviews">
          <Card className="cursor-pointer hover:border-blue-300">
            <CardContent>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">{t('interviews')}</p>
                  <p className="text-2xl font-bold">{stats.INTERVIEW ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
