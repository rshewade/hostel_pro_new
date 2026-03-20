import { pgTable, uuid, text, boolean, date, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { userRoleEnum, verticalTypeEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: text('auth_user_id').unique(),
  role: userRoleEnum('role').notNull().default('STUDENT'),
  vertical: verticalTypeEnum('vertical'),
  fullName: text('full_name').notNull(),
  email: text('email').unique(),
  mobile: text('mobile').notNull(),
  parentMobile: text('parent_mobile'),
  address: text('address'),
  dateOfBirth: date('date_of_birth'),
  isActive: boolean('is_active').default(true),
  requiresPasswordChange: boolean('requires_password_change').default(false),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_users_role').on(table.role),
  index('idx_users_vertical').on(table.vertical),
  index('idx_users_mobile').on(table.mobile),
  index('idx_users_parent_mobile').on(table.parentMobile),
]);
