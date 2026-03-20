import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { createLeaveRequest, listLeaves, getLeaveStats } from '@/lib/services/leaves';
import { z } from 'zod';

const createLeaveSchema = z.object({
  type: z.enum(['HOME_VISIT', 'SHORT_LEAVE', 'MEDICAL', 'EMERGENCY', 'OTHER']),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().min(1),
  destination: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role, vertical } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'PARENT']);
    const { searchParams } = req.nextUrl;

    if (searchParams.get('stats') === 'true') {
      const stats = await getLeaveStats(vertical);
      return NextResponse.json(stats);
    }

    const data = await listLeaves({
      studentUserId: role === 'STUDENT' ? session.user.id : searchParams.get('studentUserId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1'),
      limit: parseInt(searchParams.get('limit') ?? '20'),
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);
    const body = createLeaveSchema.parse(await req.json());
    const leave = await createLeaveRequest({
      ...body,
      studentUserId: session.user.id,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
    return NextResponse.json(leave, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
