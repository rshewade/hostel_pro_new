import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { renewals } from '@/lib/db/schema';
import { eq, and, count, SQL } from 'drizzle-orm';
import { z } from 'zod';

const createRenewalSchema = z.object({
  studentUserId: z.string().uuid().optional(), // staff can specify; students auto-use their own
  applicationId: z.string().uuid().optional(),
  periodStart: z.string(), // YYYY-MM-DD
  periodEnd: z.string(),
  consentGiven: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE']);
    const { searchParams } = req.nextUrl;

    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const conditions: SQL[] = [];

    // Students can only see their own renewals
    if (role === 'STUDENT') {
      conditions.push(eq(renewals.studentUserId, session.user.id));
    } else {
      const studentUserId = searchParams.get('studentUserId');
      if (studentUserId) conditions.push(eq(renewals.studentUserId, studentUserId));
    }

    const status = searchParams.get('status');
    if (status) conditions.push(eq(renewals.status, status as 'DRAFT' | 'SUBMITTED' | 'REVIEW' | 'INTERVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select().from(renewals).where(where).limit(limit).offset((page - 1) * limit).orderBy(renewals.createdAt),
      db.select({ total: count() }).from(renewals).where(where),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE']);
    const body = createRenewalSchema.parse(await req.json());

    const studentUserId = role === 'STUDENT' ? session.user.id : body.studentUserId;
    if (!studentUserId) {
      const { ValidationError } = await import('@/lib/errors');
      throw new ValidationError('studentUserId is required for staff-created renewals');
    }

    const [renewal] = await db.insert(renewals).values({
      studentUserId,
      applicationId: body.applicationId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      status: 'DRAFT',
      consentGiven: body.consentGiven,
      consentGivenAt: body.consentGiven ? new Date() : undefined,
    }).returning();

    return NextResponse.json(renewal, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
