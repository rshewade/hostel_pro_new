import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { blackoutDates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createBlackoutDateSchema = z.object({
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(),
  reason: z.string().min(1),
  vertical: z.enum(['BOYS', 'GIRLS', 'DHARAMSHALA', 'BOYS_HOSTEL', 'GIRLS_ASHRAM']).optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const data = await db.select().from(blackoutDates).where(eq(blackoutDates.isActive, true)).orderBy(blackoutDates.startDate);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['SUPERINTENDENT', 'TRUSTEE']);
    const body = createBlackoutDateSchema.parse(await req.json());

    const [blackoutDate] = await db.insert(blackoutDates).values(body).returning();
    return NextResponse.json(blackoutDate, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
