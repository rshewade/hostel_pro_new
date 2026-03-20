import { pgTable, uuid, text, date, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { verticalTypeEnum } from './enums';

export const leaveTypes = pgTable('leave_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  maxDays: text('max_days'),
  requiresApproval: boolean('requires_approval').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const blackoutDates = pgTable('blackout_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason').notNull(),
  vertical: verticalTypeEnum('vertical'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const notificationRules = pgTable('notification_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: text('event_type').notNull(),
  timing: text('timing').notNull().default('IMMEDIATE'),
  channels: jsonb('channels').default({ sms: true, whatsapp: true, email: false }),
  verticals: jsonb('verticals'),
  template: text('template').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_notification_rules_event_type').on(table.eventType),
  index('idx_notification_rules_is_active').on(table.isActive),
]);
