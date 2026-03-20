import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getPaymentSummary } from '@/lib/services/payments';
import { getStudentAllocation } from '@/lib/services/rooms';
import { getUnreadCount } from '@/lib/services/notifications';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);

    const [paymentSummary, roomAllocation, unreadNotifications] = await Promise.all([
      getPaymentSummary(session.user.id),
      getStudentAllocation(session.user.id),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({
      paymentSummary,
      roomAllocation,
      unreadNotifications,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
