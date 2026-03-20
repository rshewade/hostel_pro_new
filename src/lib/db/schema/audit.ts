import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  action: text('action').notNull(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole: text('actor_role'),
  actorEmail: text('actor_email'),
  metadata: jsonb('metadata').default({}),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_audit_logs_entity').on(table.entityType, table.entityId),
  index('idx_audit_logs_actor_id').on(table.actorId),
  index('idx_audit_logs_action').on(table.action),
  index('idx_audit_logs_created_at').on(table.createdAt),
]);
