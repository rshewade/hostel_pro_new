import { db } from '@/lib/db';
import { rooms, roomAllocations } from '@/lib/db/schema';
import { eq, and, count, sql, SQL } from 'drizzle-orm';
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';

type RoomInsert = typeof rooms.$inferInsert;

export async function createRoom(data: Omit<RoomInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const [existing] = await db.select({ id: rooms.id }).from(rooms)
    .where(and(eq(rooms.roomNumber, data.roomNumber), eq(rooms.vertical, data.vertical!)));
  if (existing) throw new ConflictError(`Room ${data.roomNumber} already exists in ${data.vertical}`);

  const [room] = await db.insert(rooms).values({
    ...data,
    status: 'AVAILABLE',
    occupiedCount: 0,
  }).returning();
  return room;
}

export async function getRoomById(id: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
  if (!room) throw new NotFoundError('Room not found');
  return room;
}

export async function listRooms(filters: {
  vertical?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20 } = filters;
  const conditions: SQL[] = [];

  if (filters.vertical) conditions.push(sql`${rooms.vertical} = ${filters.vertical}`);
  if (filters.status) conditions.push(sql`${rooms.status} = ${filters.status}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(rooms).where(where).orderBy(rooms.roomNumber).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(rooms).where(where),
  ]);

  return { data, total, page, limit };
}

export async function allocateRoom(data: {
  studentUserId: string;
  roomId: string;
  allocatedBy: string;
}) {
  const room = await getRoomById(data.roomId);

  if (room.occupiedCount >= room.capacity) {
    throw new ValidationError('Room is at full capacity');
  }

  // Check student doesn't have an active allocation
  const [existing] = await db.select({ id: roomAllocations.id }).from(roomAllocations)
    .where(and(eq(roomAllocations.studentUserId, data.studentUserId), eq(roomAllocations.status, 'ACTIVE')));
  if (existing) throw new ConflictError('Student already has an active room allocation');

  // Occupancy update is handled by DB trigger (update_room_occupancy)
  const [allocation] = await db.insert(roomAllocations).values({
    studentUserId: data.studentUserId,
    roomId: data.roomId,
    allocatedBy: data.allocatedBy,
    status: 'ACTIVE',
  }).returning();
  return allocation;
}

export async function endAllocation(allocationId: string, vacatedBy: string) {
  const [allocation] = await db.update(roomAllocations)
    .set({ status: 'CHECKED_OUT', vacatedAt: new Date(), vacatedBy })
    .where(eq(roomAllocations.id, allocationId))
    .returning();
  if (!allocation) throw new NotFoundError('Allocation not found');
  // Occupancy update handled by DB trigger
  return allocation;
}

export async function getStudentAllocation(studentUserId: string) {
  const [allocation] = await db.select().from(roomAllocations)
    .where(and(eq(roomAllocations.studentUserId, studentUserId), eq(roomAllocations.status, 'ACTIVE')));
  return allocation ?? null;
}
