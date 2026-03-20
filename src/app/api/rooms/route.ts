import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { createRoom, listRooms } from '@/lib/services/rooms';
import { z } from 'zod';

const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  vertical: z.enum(['BOYS', 'GIRLS', 'DHARAMSHALA', 'BOYS_HOSTEL', 'GIRLS_ASHRAM']),
  block: z.string().optional(),
  floor: z.number().int().optional(),
  capacity: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role, vertical } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS']);
    const { searchParams } = req.nextUrl;

    const data = await listRooms({
      vertical: role === 'SUPERINTENDENT' ? vertical ?? undefined : searchParams.get('vertical') ?? undefined,
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
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = createRoomSchema.parse(await req.json());
    const room = await createRoom(body);
    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
