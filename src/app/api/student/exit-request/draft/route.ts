import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { exitRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);

    const [draft] = await db.select()
      .from(exitRequests)
      .where(
        and(
          eq(exitRequests.studentUserId, session.user.id),
          eq(exitRequests.status, 'PENDING'),
        ),
      )
      .limit(1);

    return NextResponse.json({ data: draft ?? null });
  } catch (err) {
    return handleApiError(err);
  }
}
