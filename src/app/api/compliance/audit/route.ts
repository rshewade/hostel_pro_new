import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getAuditLogsByActor, getAuditLogsByEntity } from '@/lib/services/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['TRUSTEE', 'ACCOUNTS', 'SUPERINTENDENT']);
    const { searchParams } = req.nextUrl;

    const actorId = searchParams.get('actorId');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') ?? '100');

    if (entityType && entityId) {
      const data = await getAuditLogsByEntity(entityType, entityId, limit);
      return NextResponse.json(data);
    }
    if (actorId) {
      const data = await getAuditLogsByActor(actorId, limit);
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Provide actorId or entityType+entityId', status: 400 } },
      { status: 400 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
