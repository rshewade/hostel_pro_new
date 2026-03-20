import { getTranslations } from 'next-intl/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, BarChart3, FileText } from 'lucide-react';

export default async function AccountsDashboard() {
  const t = await getTranslations('Dashboard');
  const session = await requireAuth();
  await requireRole(session, ['ACCOUNTS']);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('accountsDashboard')}</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">{t('feeManagement')}</p>
                <p className="text-lg font-medium">Manage Fees & Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">{t('reconciliation')}</p>
                <p className="text-lg font-medium">Payment Reconciliation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">{t('reports')}</p>
                <p className="text-lg font-medium">Financial Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
