import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const updateInterviewSchema = z.object({
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  mode: z.enum(['ONLINE', 'IN_PERSON', 'PHONE']).optional(),
  meetingLink: z.string().url().nullable().optional(),
  location: z.string().nullable().optional(),
  superintendentId: z.string().uuid().nullable().optional(),
  trusteeId: z.string().uuid().nullable().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED']).optional(),
  notes: z.string().optional(),
  internalRemarks: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    if (!interview) throw new NotFoundError('Interview not found');
    return NextResponse.json(interview);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const { id } = await params;
    const body = updateInterviewSchema.parse(await req.json());

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };

    // Recompute scheduleDatetime if date or time changed
    if (body.scheduledDate || body.scheduledTime) {
      const [existing] = await db.select().from(interviews).where(eq(interviews.id, id));
      if (!existing) throw new NotFoundError('Interview not found');
      const date = body.scheduledDate ?? existing.scheduledDate;
      const time = body.scheduledTime ?? existing.scheduledTime;
      updates.scheduleDatetime = new Date(`${date}T${time}:00`);
    }

    const [interview] = await db.update(interviews)
      .set(updates)
      .where(eq(interviews.id, id))
      .returning();
    if (!interview) throw new NotFoundError('Interview not found');
    return NextResponse.json(interview);
  } catch (err) {
    return handleApiError(err);
  }
}
