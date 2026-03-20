import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getApplicationStats } from '@/lib/services/applications';
import { getLeaveStats } from '@/lib/services/leaves';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role, vertical } = await requireRole(session, ['SUPERINTENDENT']);

    const [applicationStats, leaveStats] = await Promise.all([
      getApplicationStats(role, vertical),
      getLeaveStats(vertical),
    ]);

    return NextResponse.json({ applicationStats, leaveStats });
  } catch (err) {
    return handleApiError(err);
  }
}
