import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { db } from '@/lib/db';
import { fees, payments } from '@/lib/db/schema';
import { count, sum, eq } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['ACCOUNTS']);

    const [feeTotals, paymentStats] = await Promise.all([
      db.select({
        status: fees.status,
        count: count(),
        totalAmount: sum(fees.amount),
      })
        .from(fees)
        .groupBy(fees.status),
      db.select({
        status: payments.status,
        count: count(),
        totalAmount: sum(payments.amount),
      })
        .from(payments)
        .groupBy(payments.status),
    ]);

    return NextResponse.json({
      feeTotals: Object.fromEntries(
        feeTotals.map((r) => [r.status, { count: r.count, totalAmount: r.totalAmount }]),
      ),
      paymentStats: Object.fromEntries(
        paymentStats.map((r) => [r.status, { count: r.count, totalAmount: r.totalAmount }]),
      ),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
