import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getAuditLogsByEntity } from '@/lib/services/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS']);

    const { type, id } = await params;
    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get('limit') ?? '100');

    const data = await getAuditLogsByEntity(type, id, limit);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
