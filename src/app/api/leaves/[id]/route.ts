import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getLeaveById, updateLeaveStatus } from '@/lib/services/leaves';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  reason: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const leave = await getLeaveById(id);
    return NextResponse.json(leave);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE', 'STUDENT']);
    const { id } = await params;
    const body = statusSchema.parse(await req.json());
    const leave = await updateLeaveStatus(id, body.status, session.user.id, body.reason);
    return NextResponse.json(leave);
  } catch (err) {
    return handleApiError(err);
  }
}
