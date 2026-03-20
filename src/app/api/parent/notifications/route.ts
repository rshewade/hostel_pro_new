import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { users, notifications } from '@/lib/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = req.nextUrl;

    // Look up parent user
    const [parentUser] = await db.select()
      .from(users)
      .where(eq(users.authUserId, session.user.id));

    if (!parentUser) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Parent profile not found', status: 404 } },
        { status: 404 },
      );
    }

    // Collect parent's own userId plus linked student user IDs
    const linkedStudents = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.parentMobile, parentUser.mobile));

    const userIds = [parentUser.id, ...linkedStudents.map((s) => s.id)];

    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');

    const data = await db.select()
      .from(notifications)
      .where(inArray(notifications.userId, userIds))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
