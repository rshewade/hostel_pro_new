import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { users, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    // Look up the parent user to get their mobile number
    const [parentUser] = await db.select()
      .from(users)
      .where(eq(users.authUserId, session.user.id));

    if (!parentUser) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Parent profile not found', status: 404 } },
        { status: 404 },
      );
    }

    // Find students whose parentMobile matches this parent's mobile
    const linkedStudents = await db.select({
      user: users,
      student: students,
    })
      .from(users)
      .innerJoin(students, eq(students.userId, users.id))
      .where(eq(users.parentMobile, parentUser.mobile));

    return NextResponse.json({ data: linkedStudents });
  } catch (err) {
    return handleApiError(err);
  }
}
