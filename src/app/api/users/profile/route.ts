import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getUserByAuthId, updateUserProfile } from '@/lib/services/users';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    const user = await getUserByAuthId(session.user.id);
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const user = await updateUserProfile(session.user.id, body);
    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}
