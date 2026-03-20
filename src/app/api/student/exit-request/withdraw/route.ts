import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { exitRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);

    const [updated] = await db.update(exitRequests)
      .set({ status: 'CANCELLED' })
      .where(
        and(
          eq(exitRequests.studentUserId, session.user.id),
          eq(exitRequests.status, 'PENDING'),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'No pending exit request found to withdraw', status: 404 } },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
