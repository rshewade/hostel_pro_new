import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { users, students, fees, leaveRequests } from '@/lib/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

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

    // Find linked students via parentMobile
    const linkedStudents = await db.select({
      user: users,
      student: students,
    })
      .from(users)
      .innerJoin(students, eq(students.userId, users.id))
      .where(eq(users.parentMobile, parentUser.mobile));

    const studentIds = linkedStudents.map((s) => s.user.id);

    if (studentIds.length === 0) {
      return NextResponse.json({
        students: [],
        recentFees: [],
        recentLeaves: [],
      });
    }

    const [recentFees, recentLeaves] = await Promise.all([
      db.select()
        .from(fees)
        .where(inArray(fees.studentUserId, studentIds))
        .orderBy(desc(fees.createdAt))
        .limit(10),
      db.select()
        .from(leaveRequests)
        .where(inArray(leaveRequests.studentUserId, studentIds))
        .orderBy(desc(leaveRequests.createdAt))
        .limit(10),
    ]);

    return NextResponse.json({
      students: linkedStudents,
      recentFees,
      recentLeaves,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
