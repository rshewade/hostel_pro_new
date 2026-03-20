import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq, and, count, SQL } from 'drizzle-orm';
import { z } from 'zod';

const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  scheduledDate: z.string(), // YYYY-MM-DD
  scheduledTime: z.string(), // HH:mm
  mode: z.enum(['ONLINE', 'IN_PERSON', 'PHONE']).default('IN_PERSON'),
  meetingLink: z.string().url().optional(),
  location: z.string().optional(),
  superintendentId: z.string().uuid().optional(),
  trusteeId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE', 'STUDENT']);
    const { searchParams } = req.nextUrl;

    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const conditions: SQL[] = [];

    const status = searchParams.get('status');
    if (status) conditions.push(eq(interviews.status, status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED'));

    const applicationId = searchParams.get('applicationId');
    if (applicationId) conditions.push(eq(interviews.applicationId, applicationId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select().from(interviews).where(where).limit(limit).offset((page - 1) * limit).orderBy(interviews.scheduledDate),
      db.select({ total: count() }).from(interviews).where(where),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = createInterviewSchema.parse(await req.json());

    const scheduleDatetime = new Date(`${body.scheduledDate}T${body.scheduledTime}:00`);

    const [interview] = await db.insert(interviews).values({
      applicationId: body.applicationId,
      scheduledDate: body.scheduledDate,
      scheduledTime: body.scheduledTime,
      scheduleDatetime,
      mode: body.mode,
      meetingLink: body.meetingLink,
      location: body.location,
      superintendentId: body.superintendentId,
      trusteeId: body.trusteeId,
      status: 'SCHEDULED',
    }).returning();

    return NextResponse.json(interview, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
