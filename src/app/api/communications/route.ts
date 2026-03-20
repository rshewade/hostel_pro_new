import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { communications } from '@/lib/db/schema';
import { desc, count, eq, and, SQL } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS']);

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const conditions: SQL[] = [];
    if (type) conditions.push(eq(communications.type, type as 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH'));
    if (status) conditions.push(eq(communications.status, status as 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED'));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select()
        .from(communications)
        .where(where)
        .orderBy(desc(communications.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() })
        .from(communications)
        .where(where),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}
