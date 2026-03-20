import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { interviewSlots } from '@/lib/db/schema';
import { eq, and, gte, SQL } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const conditions: SQL[] = [eq(interviewSlots.isAvailable, true)];

    const fromDate = searchParams.get('fromDate');
    if (fromDate) conditions.push(gte(interviewSlots.slotDate, fromDate));

    const vertical = searchParams.get('vertical');
    if (vertical) conditions.push(eq(interviewSlots.vertical, vertical as 'BOYS' | 'GIRLS' | 'DHARAMSHALA' | 'BOYS_HOSTEL' | 'GIRLS_ASHRAM'));

    const mode = searchParams.get('mode');
    if (mode) conditions.push(eq(interviewSlots.mode, mode as 'ONLINE' | 'IN_PERSON' | 'PHONE'));

    const where = and(...conditions);
    const data = await db.select().from(interviewSlots).where(where).orderBy(interviewSlots.slotDate, interviewSlots.startTime);

    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
