import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { roomStatusEnum, allocationStatusEnum, verticalTypeEnum } from './enums';
import { users } from './users';

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomNumber: text('room_number').notNull(),
  vertical: verticalTypeEnum('vertical').notNull(),
  block: text('block'),
  floor: integer('floor').default(1),
  capacity: integer('capacity').notNull().default(2),
  occupiedCount: integer('occupied_count').notNull().default(0),
  status: roomStatusEnum('status').notNull().default('AVAILABLE'),
  amenities: text('amenities').array().default(sql`'{}'`),
  description: text('description'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique('rooms_room_vertical_unique').on(table.roomNumber, table.vertical),
  check('rooms_occupancy_check', sql`${table.occupiedCount} >= 0 AND ${table.occupiedCount} <= ${table.capacity}`),
  index('idx_rooms_vertical').on(table.vertical),
  index('idx_rooms_status').on(table.status),
  index('idx_rooms_room_number').on(table.roomNumber),
]);

export const roomAllocations = pgTable('room_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentUserId: uuid('student_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'restrict' }),
  allocatedAt: timestamp('allocated_at', { withTimezone: true }).notNull().defaultNow(),
  allocatedBy: uuid('allocated_by').references(() => users.id, { onDelete: 'set null' }),
  vacatedAt: timestamp('vacated_at', { withTimezone: true }),
  vacatedBy: uuid('vacated_by').references(() => users.id, { onDelete: 'set null' }),
  status: allocationStatusEnum('status').notNull().default('ACTIVE'),
  checkInConfirmed: boolean('check_in_confirmed').default(false),
  checkInConfirmedAt: timestamp('check_in_confirmed_at', { withTimezone: true }),
  inventoryAcknowledged: boolean('inventory_acknowledged').default(false),
  inventoryAcknowledgedAt: timestamp('inventory_acknowledged_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_room_allocations_student').on(table.studentUserId),
  index('idx_room_allocations_room').on(table.roomId),
  index('idx_room_allocations_status').on(table.status),
]);
