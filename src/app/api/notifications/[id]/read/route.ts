import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { markAsRead } from '@/lib/services/notifications';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const notif = await markAsRead(id, session.user.id);
    return NextResponse.json(notif);
  } catch (err) {
    return handleApiError(err);
  }
}
