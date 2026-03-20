import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { exitRequests } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);

    const data = await db.select()
      .from(exitRequests)
      .where(eq(exitRequests.studentUserId, session.user.id))
      .orderBy(desc(exitRequests.createdAt));

    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);

    const body = await req.json();

    const [exitRequest] = await db.insert(exitRequests).values({
      studentUserId: session.user.id,
      reason: body.reason,
      expectedExitDate: body.expectedExitDate,
      forwardingAddress: body.forwardingAddress ?? null,
      bankAccountHolder: body.bankAccountHolder ?? null,
      bankAccountNumber: body.bankAccountNumber ?? null,
      bankIfscCode: body.bankIfscCode ?? null,
      bankName: body.bankName ?? null,
      notes: body.notes ?? null,
      status: 'PENDING',
    }).returning();

    return NextResponse.json(exitRequest, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
