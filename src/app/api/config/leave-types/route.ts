import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { leaveTypes } from '@/lib/db/schema';
import { z } from 'zod';

const createLeaveTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxDays: z.string().optional(),
  requiresApproval: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const data = await db.select().from(leaveTypes).orderBy(leaveTypes.name);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = createLeaveTypeSchema.parse(await req.json());

    const [leaveType] = await db.insert(leaveTypes).values(body).returning();
    return NextResponse.json(leaveType, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
