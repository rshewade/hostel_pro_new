import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getApplicationStats } from '@/lib/services/applications';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role, vertical } = await requireRole(session, ['TRUSTEE']);

    const [applicationStats, [pendingInterviews]] = await Promise.all([
      getApplicationStats(role, vertical),
      db.select({ count: count() })
        .from(interviews)
        .where(eq(interviews.status, 'SCHEDULED')),
    ]);

    return NextResponse.json({
      applicationStats,
      pendingInterviews: pendingInterviews?.count ?? 0,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
