import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { allocateRoom, getStudentAllocation } from '@/lib/services/rooms';
import { db } from '@/lib/db';
import { roomAllocations } from '@/lib/db/schema';
import { eq, and, count, SQL, sql } from 'drizzle-orm';
import { z } from 'zod';

const createAllocationSchema = z.object({
  studentUserId: z.string().uuid(),
  roomId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE']);
    const { searchParams } = req.nextUrl;

    // Students can only see their own allocation
    if (role === 'STUDENT') {
      const allocation = await getStudentAllocation(session.user.id);
      return NextResponse.json({ data: allocation ? [allocation] : [], total: allocation ? 1 : 0 });
    }

    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const conditions: SQL[] = [];

    const status = searchParams.get('status');
    if (status) conditions.push(eq(roomAllocations.status, status as 'ACTIVE' | 'CHECKED_OUT' | 'TRANSFERRED' | 'CANCELLED'));

    const roomId = searchParams.get('roomId');
    if (roomId) conditions.push(eq(roomAllocations.roomId, roomId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select().from(roomAllocations).where(where).limit(limit).offset((page - 1) * limit).orderBy(roomAllocations.allocatedAt),
      db.select({ total: count() }).from(roomAllocations).where(where),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = createAllocationSchema.parse(await req.json());
    const allocation = await allocateRoom({
      ...body,
      allocatedBy: session.user.id,
    });
    return NextResponse.json(allocation, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
