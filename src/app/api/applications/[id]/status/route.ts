import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { updateApplicationStatus } from '@/lib/services/applications';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['SUBMITTED', 'REVIEW', 'INTERVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED']),
  reason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const { id } = await params;
    const body = statusSchema.parse(await req.json());
    const app = await updateApplicationStatus(id, body.status, session.user.id, body.reason);
    return NextResponse.json(app);
  } catch (err) {
    return handleApiError(err);
  }
}
