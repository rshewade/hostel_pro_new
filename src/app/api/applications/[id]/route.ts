import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getApplicationById, updateApplication } from '@/lib/services/applications';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const app = await getApplicationById(id);
    return NextResponse.json(app);
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
    const { role } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE']);
    const { id } = await params;
    const body = await req.json();
    const app = await updateApplication(id, body, role);
    return NextResponse.json(app);
  } catch (err) {
    return handleApiError(err);
  }
}
