import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { listDocuments } from '@/lib/services/documents';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS']);
    const { searchParams } = req.nextUrl;

    const data = await listDocuments({
      applicationId: searchParams.get('applicationId') ?? undefined,
      studentUserId: role === 'STUDENT' ? session.user.id : searchParams.get('studentUserId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      documentType: searchParams.get('documentType') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1'),
      limit: parseInt(searchParams.get('limit') ?? '20'),
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
