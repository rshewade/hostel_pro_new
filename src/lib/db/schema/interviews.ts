import { pgTable, uuid, text, integer, date, time, boolean, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { interviewModeEnum, interviewStatusEnum, verticalTypeEnum } from './enums';
import { applications } from './applications';
import { users } from './users';

export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTime: time('scheduled_time').notNull(),
  scheduleDatetime: timestamp('schedule_datetime', { withTimezone: true }).notNull(),
  mode: interviewModeEnum('mode').notNull().default('IN_PERSON'),
  meetingLink: text('meeting_link'),
  location: text('location'),
  superintendentId: uuid('superintendent_id').references(() => users.id),
  trusteeId: uuid('trustee_id').references(() => users.id),
  status: interviewStatusEnum('status').notNull().default('SCHEDULED'),
  finalScore: integer('final_score'),
  notes: text('notes'),
  internalRemarks: text('internal_remarks'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  check('interviews_score_check', sql`${table.finalScore} IS NULL OR (${table.finalScore} >= 0 AND ${table.finalScore} <= 100)`),
  index('idx_interviews_application').on(table.applicationId),
  index('idx_interviews_status').on(table.status),
  index('idx_interviews_scheduled').on(table.scheduledDate),
]);

export const interviewSlots = pgTable('interview_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotDate: date('slot_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  mode: interviewModeEnum('mode').notNull().default('IN_PERSON'),
  maxInterviews: integer('max_interviews').default(1),
  bookedCount: integer('booked_count').default(0),
  isAvailable: boolean('is_available').default(true),
  superintendentId: uuid('superintendent_id').references(() => users.id),
  trusteeId: uuid('trustee_id').references(() => users.id),
  location: text('location'),
  meetingLink: text('meeting_link'),
  vertical: verticalTypeEnum('vertical'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  check('valid_time_range', sql`${table.endTime} > ${table.startTime}`),
  index('idx_interview_slots_date').on(table.slotDate),
]);
