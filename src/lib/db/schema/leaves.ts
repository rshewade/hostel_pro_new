import { pgTable, uuid, text, boolean, timestamp, jsonb, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { leaveTypeEnum, leaveStatusEnum } from './enums';
import { users } from './users';

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: leaveTypeEnum('type').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  reason: text('reason').notNull(),
  destination: text('destination'),
  emergencyContact: text('emergency_contact'),
  status: leaveStatusEnum('status').notNull().default('PENDING'),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectedBy: uuid('rejected_by').references(() => users.id, { onDelete: 'set null' }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  parentNotified: boolean('parent_notified').default(false),
  parentNotifiedAt: timestamp('parent_notified_at', { withTimezone: true }),
  checkOutTime: timestamp('check_out_time', { withTimezone: true }),
  checkInTime: timestamp('check_in_time', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  check('leave_requests_time_valid', sql`${table.endTime} > ${table.startTime}`),
  index('idx_leave_requests_student').on(table.studentUserId),
  index('idx_leave_requests_status').on(table.status),
  index('idx_leave_requests_type').on(table.type),
  index('idx_leave_requests_start_time').on(table.startTime),
]);
