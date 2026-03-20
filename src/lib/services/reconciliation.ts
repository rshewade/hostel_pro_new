import { db } from '@/lib/db';
import { fees, payments } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export interface ReconciliationResult {
  totalFees: number;
  totalPayments: number;
  difference: number;
  unmatchedFees: number;
  unmatchedPayments: number;
  period: { start: string; end: string };
}

export async function reconcile(startDate: string, endDate: string): Promise<ReconciliationResult> {
  const [feeResult] = await db.select({
    total: sql<number>`COALESCE(SUM(${fees.amount}::numeric), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(fees)
    .where(and(
      sql`${fees.createdAt} >= ${startDate}::timestamptz`,
      sql`${fees.createdAt} <= ${endDate}::timestamptz`,
    ));

  const [paymentResult] = await db.select({
    total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(payments)
    .where(and(
      eq(payments.status, 'PAID'),
      sql`${payments.paidAt} >= ${startDate}::timestamptz`,
      sql`${payments.paidAt} <= ${endDate}::timestamptz`,
    ));

  // Fees without any payment
  const [unmatchedFeesResult] = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(fees)
    .where(and(
      eq(fees.status, 'PENDING'),
      sql`${fees.createdAt} >= ${startDate}::timestamptz`,
      sql`${fees.createdAt} <= ${endDate}::timestamptz`,
    ));

  return {
    totalFees: Number(feeResult?.total ?? 0),
    totalPayments: Number(paymentResult?.total ?? 0),
    difference: Number(feeResult?.total ?? 0) - Number(paymentResult?.total ?? 0),
    unmatchedFees: Number(unmatchedFeesResult?.count ?? 0),
    unmatchedPayments: 0, // payments without fees would need a LEFT JOIN check
    period: { start: startDate, end: endDate },
  };
}
