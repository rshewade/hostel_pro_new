import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { desc, count, eq, and, SQL } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS']);

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const entityType = searchParams.get('entityType');
    const actorId = searchParams.get('actorId');

    const conditions: SQL[] = [];
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    if (actorId) conditions.push(eq(auditLogs.actorId, actorId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() })
        .from(auditLogs)
        .where(where),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}
