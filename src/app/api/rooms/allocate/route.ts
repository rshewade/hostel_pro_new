import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { allocateRoom } from '@/lib/services/rooms';
import { z } from 'zod';

const allocateSchema = z.object({
  studentUserId: z.string().uuid(),
  roomId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = allocateSchema.parse(await req.json());
    const allocation = await allocateRoom({
      ...body,
      allocatedBy: session.user.id,
    });
    return NextResponse.json(allocation, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
