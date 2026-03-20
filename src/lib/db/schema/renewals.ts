import { pgTable, uuid, text, boolean, date, timestamp, jsonb, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { applicationStatusEnum } from './enums';
import { users } from './users';
import { applications } from './applications';

export const renewals = pgTable('renewals', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  status: applicationStatusEnum('status').notNull().default('DRAFT'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  rejectedBy: uuid('rejected_by').references(() => users.id, { onDelete: 'set null' }),
  rejectionReason: text('rejection_reason'),
  consentGiven: boolean('consent_given').default(false),
  consentGivenAt: timestamp('consent_given_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  check('renewals_period_valid', sql`${table.periodEnd} > ${table.periodStart}`),
  index('idx_renewals_student').on(table.studentUserId),
  index('idx_renewals_application').on(table.applicationId),
  index('idx_renewals_status').on(table.status),
]);
