import { db } from '@/lib/db';
import { fees, payments } from '@/lib/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';

type FeeInsert = typeof fees.$inferInsert;
type PaymentInsert = typeof payments.$inferInsert;

export async function createFee(data: Omit<FeeInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const [fee] = await db.insert(fees).values({
    ...data,
    status: 'PENDING',
  }).returning();
  return fee;
}

export async function getFeeById(id: string) {
  const [fee] = await db.select().from(fees).where(eq(fees.id, id));
  if (!fee) throw new NotFoundError('Fee not found');
  return fee;
}

export async function listFees(filters: {
  studentUserId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20 } = filters;
  const conditions = [];

  if (filters.studentUserId) conditions.push(eq(fees.studentUserId, filters.studentUserId));
  if (filters.status) conditions.push(sql`${fees.status} = ${filters.status}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(fees).where(where).orderBy(desc(fees.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(fees).where(where),
  ]);

  return { data, total, page, limit };
}

export async function recordPayment(data: Omit<PaymentInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  if (data.feeId) {
    const fee = await getFeeById(data.feeId);
    const paid = parseFloat(fee.waivedAmount ?? '0');
    const remaining = parseFloat(fee.amount) - paid;
    if (parseFloat(data.amount) > remaining) {
      throw new ValidationError(`Payment amount exceeds remaining balance of ${remaining}`);
    }
  }

  const [payment] = await db.insert(payments).values({
    ...data,
    status: 'PAID',
    paidAt: new Date(),
  }).returning();

  // Fee status update is handled by DB trigger (update_fee_on_payment)
  return payment;
}

export async function getPaymentById(id: string) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id));
  if (!payment) throw new NotFoundError('Payment not found');
  return payment;
}

export async function getPaymentSummary(studentUserId: string) {
  const studentFees = await db.select().from(fees).where(eq(fees.studentUserId, studentUserId));
  const today = new Date().toISOString().split('T')[0];

  const totalDue = studentFees.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const totalPaid = studentFees
    .filter((f) => f.status === 'PAID' || f.status === 'WAIVED')
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const totalPending = totalDue - totalPaid;
  const overdueFees = studentFees.filter((f) => f.status === 'PENDING' && f.dueDate < today).length;

  return { totalDue, totalPaid, totalPending, overdueFees };
}

export async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const prefix = `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [result] = await db.select({ count: count() })
    .from(payments)
    .where(sql`${payments.createdAt} >= date_trunc('month', NOW())`);

  const seq = (result?.count ?? 0) + 1;
  return `${prefix}-${String(seq).padStart(5, '0')}`;
}
