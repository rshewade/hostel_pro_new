import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { notificationTypeEnum, communicationTypeEnum, communicationStatusEnum } from './enums';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  actionUrl: text('action_url'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index('idx_notifications_user').on(table.userId),
  index('idx_notifications_type').on(table.type),
  index('idx_notifications_created').on(table.createdAt),
]);

export const communications = pgTable('communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: communicationTypeEnum('type').notNull(),
  template: text('template'),
  recipientId: uuid('recipient_id').references(() => users.id),
  recipientName: text('recipient_name'),
  recipientMobile: text('recipient_mobile'),
  recipientEmail: text('recipient_email'),
  subject: text('subject'),
  message: text('message').notNull(),
  status: communicationStatusEnum('status').notNull().default('PENDING'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  provider: text('provider'),
  providerMessageId: text('provider_message_id'),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_communications_recipient').on(table.recipientId),
  index('idx_communications_type').on(table.type),
  index('idx_communications_status').on(table.status),
  index('idx_communications_created').on(table.createdAt),
]);
