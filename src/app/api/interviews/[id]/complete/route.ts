import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { interviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

const completeInterviewSchema = z.object({
  finalScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
  internalRemarks: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const { id } = await params;
    const body = completeInterviewSchema.parse(await req.json());

    const [existing] = await db.select().from(interviews).where(eq(interviews.id, id));
    if (!existing) throw new NotFoundError('Interview not found');
    if (existing.status === 'COMPLETED') throw new ValidationError('Interview is already completed');
    if (existing.status === 'CANCELLED') throw new ValidationError('Cannot complete a cancelled interview');

    const [interview] = await db.update(interviews)
      .set({
        status: 'COMPLETED',
        finalScore: body.finalScore,
        notes: body.notes ?? existing.notes,
        internalRemarks: body.internalRemarks ?? existing.internalRemarks,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, id))
      .returning();

    return NextResponse.json(interview);
  } catch (err) {
    return handleApiError(err);
  }
}
