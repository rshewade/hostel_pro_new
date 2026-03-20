import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { listNotifications } from '@/lib/services/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = req.nextUrl;
    const data = await listNotifications(
      session.user.id,
      parseInt(searchParams.get('page') ?? '1'),
      parseInt(searchParams.get('limit') ?? '20'),
    );
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
