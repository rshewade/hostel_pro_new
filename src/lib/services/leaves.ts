import { db } from '@/lib/db';
import { leaveRequests } from '@/lib/db/schema';
import { eq, and, desc, count, gte, lte, or, sql, SQL } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';

type LeaveInsert = typeof leaveRequests.$inferInsert;

export async function createLeaveRequest(data: Omit<LeaveInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  if (new Date(data.startTime) < now) {
    throw new ValidationError('Start time must be in the future');
  }
  if (new Date(data.endTime) <= new Date(data.startTime)) {
    throw new ValidationError('End time must be after start time');
  }

  // Check for overlapping leaves
  const overlapping = await db.select({ id: leaveRequests.id }).from(leaveRequests)
    .where(and(
      eq(leaveRequests.studentUserId, data.studentUserId),
      or(
        eq(leaveRequests.status, 'PENDING'),
        eq(leaveRequests.status, 'APPROVED'),
      ),
      lte(leaveRequests.startTime, new Date(data.endTime)),
      gte(leaveRequests.endTime, new Date(data.startTime)),
    ));

  if (overlapping.length > 0) {
    throw new ValidationError('You have an overlapping leave request for this period');
  }

  const [leave] = await db.insert(leaveRequests).values({
    ...data,
    status: 'PENDING',
  }).returning();
  return leave;
}

export async function getLeaveById(id: string) {
  const [leave] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
  if (!leave) throw new NotFoundError('Leave request not found');
  return leave;
}

export async function listLeaves(filters: {
  studentUserId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20 } = filters;
  const conditions: SQL[] = [];

  if (filters.studentUserId) conditions.push(eq(leaveRequests.studentUserId, filters.studentUserId));
  if (filters.status) conditions.push(sql`${leaveRequests.status} = ${filters.status}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(leaveRequests).where(where).orderBy(desc(leaveRequests.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(leaveRequests).where(where),
  ]);

  return { data, total, page, limit };
}

export async function updateLeaveStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
  userId: string,
  reason?: string,
) {
  // Status transition validated by DB trigger
  const updates: Partial<LeaveInsert> = { status };

  if (status === 'APPROVED') {
    updates.approvedBy = userId;
    updates.approvedAt = new Date();
  } else if (status === 'REJECTED') {
    updates.rejectedBy = userId;
    updates.rejectedAt = new Date();
    updates.rejectionReason = reason;
  }

  const [leave] = await db.update(leaveRequests)
    .set(updates)
    .where(eq(leaveRequests.id, id))
    .returning();
  if (!leave) throw new NotFoundError('Leave request not found');
  return leave;
}

export async function getLeaveStats(_userVertical?: string | null) {
  const result = await db.select({
    status: leaveRequests.status,
    count: count(),
  }).from(leaveRequests).groupBy(leaveRequests.status);

  return Object.fromEntries(result.map((r) => [r.status, r.count]));
}
