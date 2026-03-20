import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getUnreadCount } from '@/lib/services/notifications';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch (err) {
    return handleApiError(err);
  }
}
