import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { endAllocation } from '@/lib/services/rooms';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const { id } = await params;
    const allocation = await endAllocation(id, session.user.id);
    return NextResponse.json(allocation);
  } catch (err) {
    return handleApiError(err);
  }
}
