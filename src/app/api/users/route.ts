import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS']);
    const data = await db.select().from(users).orderBy(desc(users.createdAt));
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
