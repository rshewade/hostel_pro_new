import { pgTable, uuid, text, decimal, date, timestamp, jsonb, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { feeHeadEnum, paymentStatusEnum, paymentMethodEnum } from './enums';
import { users } from './users';
import { applications } from './applications';

export const fees = pgTable('fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
  head: feeHeadEnum('head').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  receiptNumber: text('receipt_number').unique(),
  waivedAmount: decimal('waived_amount', { precision: 12, scale: 2 }).default('0'),
  waivedBy: uuid('waived_by').references(() => users.id, { onDelete: 'set null' }),
  waivedReason: text('waived_reason'),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  check('fees_amount_positive', sql`${table.amount} >= 0`),
  index('idx_fees_student').on(table.studentUserId),
  index('idx_fees_application').on(table.applicationId),
  index('idx_fees_status').on(table.status),
  index('idx_fees_due_date').on(table.dueDate),
  index('idx_fees_head').on(table.head),
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  feeId: uuid('fee_id').references(() => fees.id, { onDelete: 'set null' }),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  transactionId: text('transaction_id'),
  gatewayReference: text('gateway_reference'),
  status: paymentStatusEnum('status').notNull().default('PENDING'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  receiptUrl: text('receipt_url'),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  check('payments_amount_positive', sql`${table.amount} > 0`),
  index('idx_payments_fee').on(table.feeId),
  index('idx_payments_student').on(table.studentUserId),
  index('idx_payments_status').on(table.status),
  index('idx_payments_transaction_id').on(table.transactionId),
  index('idx_payments_paid_at').on(table.paidAt),
]);
