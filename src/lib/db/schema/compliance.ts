import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { applications } from './applications';

export const consentLogs = pgTable('consent_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
  consentType: text('consent_type').notNull(),
  consentVersion: text('consent_version').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  digitalSignature: text('digital_signature'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_consent_logs_user_id').on(table.userId),
]);
