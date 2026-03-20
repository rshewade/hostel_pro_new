import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, cleanDb, closeDb } from '@/test/integration.setup';
import { rooms, roomAllocations, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Override db module to use test database
import * as dbModule from '@/lib/db';
Object.defineProperty(dbModule, 'db', { value: testDb, writable: true });

import { createRoom, getRoomById, allocateRoom, endAllocation, getStudentAllocation } from '../rooms';

describe('RoomsService (integration)', () => {
  let testUserId: string;

  beforeEach(async () => {
    await cleanDb();

    // Create a test user
    const [user] = await testDb.insert(users).values({
      fullName: 'Test Student',
      mobile: '+919876543210',
      role: 'STUDENT',
      vertical: 'BOYS',
    }).returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('creates a room and retrieves it', async () => {
    const room = await createRoom({
      roomNumber: 'A-101',
      vertical: 'BOYS',
      block: 'A',
      floor: 1,
      capacity: 2,
    });

    expect(room.roomNumber).toBe('A-101');
    expect(room.status).toBe('AVAILABLE');
    expect(room.occupiedCount).toBe(0);

    const fetched = await getRoomById(room.id);
    expect(fetched.id).toBe(room.id);
  });

  it('rejects duplicate room number in same vertical', async () => {
    await createRoom({ roomNumber: 'B-201', vertical: 'BOYS', capacity: 2 });
    await expect(createRoom({ roomNumber: 'B-201', vertical: 'BOYS', capacity: 2 }))
      .rejects.toThrow('already exists');
  });

  it('allows same room number in different verticals', async () => {
    await createRoom({ roomNumber: 'C-301', vertical: 'BOYS', capacity: 2 });
    const girlsRoom = await createRoom({ roomNumber: 'C-301', vertical: 'GIRLS', capacity: 2 });
    expect(girlsRoom.roomNumber).toBe('C-301');
  });

  it('allocates a room to a student', async () => {
    const room = await createRoom({ roomNumber: 'D-101', vertical: 'BOYS', capacity: 2 });

    const allocation = await allocateRoom({
      studentUserId: testUserId,
      roomId: room.id,
      allocatedBy: testUserId,
    });

    expect(allocation.status).toBe('ACTIVE');

    // Verify occupancy updated by trigger
    const updatedRoom = await getRoomById(room.id);
    expect(updatedRoom.occupiedCount).toBe(1);
  });

  it('rejects allocation when room is full', async () => {
    const room = await createRoom({ roomNumber: 'E-101', vertical: 'BOYS', capacity: 1 });

    await allocateRoom({ studentUserId: testUserId, roomId: room.id, allocatedBy: testUserId });

    // Create another student
    const [student2] = await testDb.insert(users).values({
      fullName: 'Student 2', mobile: '+919876543211', role: 'STUDENT', vertical: 'BOYS',
    }).returning();

    await expect(allocateRoom({ studentUserId: student2.id, roomId: room.id, allocatedBy: testUserId }))
      .rejects.toThrow('full capacity');
  });

  it('ends allocation and updates occupancy', async () => {
    const room = await createRoom({ roomNumber: 'F-101', vertical: 'BOYS', capacity: 2 });
    const allocation = await allocateRoom({ studentUserId: testUserId, roomId: room.id, allocatedBy: testUserId });

    await endAllocation(allocation.id, testUserId);

    const updatedRoom = await getRoomById(room.id);
    expect(updatedRoom.occupiedCount).toBe(0);

    const studentAllocation = await getStudentAllocation(testUserId);
    expect(studentAllocation).toBeNull();
  });
});
