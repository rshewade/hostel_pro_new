import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { markAllAsRead } from '@/lib/services/notifications';

export async function PATCH(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await markAllAsRead(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
