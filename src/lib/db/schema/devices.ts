import { pgTable, uuid, text, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const deviceSessions = pgTable('device_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull(),
  deviceName: text('device_name'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true),
  isSuspicious: boolean('is_suspicious').default(false),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique('device_sessions_user_device_unique').on(table.userId, table.deviceId),
  index('idx_device_sessions_user_id').on(table.userId),
  index('idx_device_sessions_device_id').on(table.deviceId),
  index('idx_device_sessions_is_active').on(table.isActive),
]);
