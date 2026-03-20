import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { roomAllocations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const updateAllocationSchema = z.object({
  notes: z.string().optional(),
  checkInConfirmed: z.boolean().optional(),
  inventoryAcknowledged: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const [allocation] = await db.select().from(roomAllocations).where(eq(roomAllocations.id, id));
    if (!allocation) throw new NotFoundError('Allocation not found');
    return NextResponse.json(allocation);
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
    const body = updateAllocationSchema.parse(await req.json());

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.checkInConfirmed) updates.checkInConfirmedAt = new Date();
    if (body.inventoryAcknowledged) updates.inventoryAcknowledgedAt = new Date();

    const [allocation] = await db.update(roomAllocations)
      .set(updates)
      .where(eq(roomAllocations.id, id))
      .returning();
    if (!allocation) throw new NotFoundError('Allocation not found');
    return NextResponse.json(allocation);
  } catch (err) {
    return handleApiError(err);
  }
}
