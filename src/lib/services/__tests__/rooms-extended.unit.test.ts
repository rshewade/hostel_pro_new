import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  rooms: {
    id: 'id',
    roomNumber: 'room_number',
    vertical: 'vertical',
    status: 'status',
    capacity: 'capacity',
    occupiedCount: 'occupied_count',
    floor: 'floor',
    type: 'type',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  roomAllocations: {
    id: 'id',
    studentUserId: 'student_user_id',
    roomId: 'room_id',
    allocatedBy: 'allocated_by',
    status: 'status',
    vacatedAt: 'vacated_at',
    vacatedBy: 'vacated_by',
    createdAt: 'created_at',
  },
}));

import {
  createRoom,
  getRoomById,
  listRooms,
  allocateRoom,
  endAllocation,
  getStudentAllocation,
} from '../rooms';
import { db } from '@/lib/db';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRoom = {
  id: 'room-1',
  roomNumber: '101',
  vertical: 'BOYS',
  status: 'AVAILABLE',
  capacity: 3,
  occupiedCount: 0,
  floor: '1',
  type: 'TRIPLE',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockAllocation = {
  id: 'alloc-1',
  studentUserId: 'student-1',
  roomId: 'room-1',
  allocatedBy: 'super-1',
  status: 'ACTIVE',
  vacatedAt: null,
  vacatedBy: null,
  createdAt: new Date('2026-01-01'),
};

// ---------------------------------------------------------------------------
// createRoom
// ---------------------------------------------------------------------------

describe('createRoom', () => {
  it('throws ConflictError when room with same number exists in same vertical', async () => {
    // First select (duplicate check) returns existing room
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'existing-room' }]),
      }),
    });

    await expect(
      createRoom({ roomNumber: '101', vertical: 'BOYS' as any, capacity: 3 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('ConflictError message includes room number and vertical', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'x' }]),
      }),
    });

    try {
      await createRoom({ roomNumber: '202', vertical: 'GIRLS' as any, capacity: 2 });
    } catch (err) {
      expect((err as ConflictError).message).toContain('202');
      expect((err as ConflictError).message).toContain('GIRLS');
    }
  });

  it('ConflictError has status 409', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'x' }]),
      }),
    });

    try {
      await createRoom({ roomNumber: '101', vertical: 'BOYS' as any, capacity: 3 });
    } catch (err) {
      expect((err as ConflictError).status).toBe(409);
      expect((err as ConflictError).code).toBe('CONFLICT');
    }
  });

  it('creates a room when no duplicate exists', async () => {
    // Duplicate check returns empty
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockRoom]),
      }),
    });

    const result = await createRoom({ roomNumber: '101', vertical: 'BOYS' as any, capacity: 3 });
    expect(result).toEqual(mockRoom);
  });

  it('initialises new room with AVAILABLE status and occupiedCount 0', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockRoom]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    await createRoom({ roomNumber: '101', vertical: 'BOYS' as any, capacity: 3 });

    const valuesMock = insertFn.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    const passedData = valuesMock.mock.calls[0]?.[0];
    expect(passedData.status).toBe('AVAILABLE');
    expect(passedData.occupiedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getRoomById
// ---------------------------------------------------------------------------

describe('getRoomById', () => {
  it('returns the room when found', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockRoom]),
      }),
    });

    const result = await getRoomById('room-1');
    expect(result).toEqual(mockRoom);
  });

  it('throws NotFoundError when room does not exist', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    await expect(getRoomById('nonexistent')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('NotFoundError has status 404', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    try {
      await getRoomById('bad-id');
    } catch (err) {
      expect((err as NotFoundError).status).toBe(404);
      expect((err as NotFoundError).code).toBe('NOT_FOUND');
    }
  });

  it('NotFoundError message mentions room', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    await expect(getRoomById('x')).rejects.toThrow('Room not found');
  });
});

// ---------------------------------------------------------------------------
// listRooms
// ---------------------------------------------------------------------------

describe('listRooms', () => {
  function mockListQuery(data: object[], total: number) {
    let callCount = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(data),
                }),
              }),
            }),
          }),
        };
      }
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total }]),
        }),
      };
    });
  }

  it('returns data, total, page, and limit', async () => {
    mockListQuery([mockRoom], 1);

    const result = await listRooms({});
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
  });

  it('defaults to page 1 and limit 20', async () => {
    mockListQuery([mockRoom], 1);

    const result = await listRooms({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('respects custom page and limit', async () => {
    mockListQuery([], 0);

    const result = await listRooms({ page: 2, limit: 5 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('filters by vertical when provided', async () => {
    mockListQuery([mockRoom], 1);

    const result = await listRooms({ vertical: 'BOYS' });
    expect(result.data).toBeDefined();
    expect(db.select).toHaveBeenCalled();
  });

  it('filters by status when provided', async () => {
    mockListQuery([mockRoom], 1);

    const result = await listRooms({ status: 'AVAILABLE' });
    expect(result.data).toBeDefined();
  });

  it('returns empty array when no rooms match', async () => {
    mockListQuery([], 0);

    const result = await listRooms({ vertical: 'GIRLS', status: 'OCCUPIED' });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns all rooms when no filters applied', async () => {
    const allRooms = [mockRoom, { ...mockRoom, id: 'room-2', roomNumber: '102' }];
    mockListQuery(allRooms, 2);

    const result = await listRooms({});
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// allocateRoom
// ---------------------------------------------------------------------------

describe('allocateRoom', () => {
  it('throws ValidationError when room is at full capacity', async () => {
    const fullRoom = { ...mockRoom, occupiedCount: 3, capacity: 3 };
    // getRoomById call
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([fullRoom]),
      }),
    });

    await expect(
      allocateRoom({ studentUserId: 'student-1', roomId: 'room-1', allocatedBy: 'super-1' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('ValidationError has status 400 for full capacity', async () => {
    const fullRoom = { ...mockRoom, occupiedCount: 2, capacity: 2 };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([fullRoom]),
      }),
    });

    try {
      await allocateRoom({ studentUserId: 'student-1', roomId: 'room-1', allocatedBy: 'super-1' });
    } catch (err) {
      expect((err as ValidationError).status).toBe(400);
      expect((err as ValidationError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('throws ConflictError when student already has an active allocation', async () => {
    const availableRoom = { ...mockRoom, occupiedCount: 1, capacity: 3 };

    let callCount = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // getRoomById
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([availableRoom]),
          }),
        };
      }
      // existing allocation check
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'existing-alloc' }]),
        }),
      };
    });

    await expect(
      allocateRoom({ studentUserId: 'student-1', roomId: 'room-1', allocatedBy: 'super-1' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('ConflictError has status 409 for duplicate allocation', async () => {
    const availableRoom = { ...mockRoom, occupiedCount: 0, capacity: 3 };

    let callCount = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([availableRoom]) }) }
        : { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: 'existing' }]) }) };
    });

    try {
      await allocateRoom({ studentUserId: 'student-1', roomId: 'room-1', allocatedBy: 'super-1' });
    } catch (err) {
      expect((err as ConflictError).status).toBe(409);
    }
  });

  it('creates an ACTIVE allocation when room has space and student has none', async () => {
    const availableRoom = { ...mockRoom, occupiedCount: 1, capacity: 3 };

    let callCount = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([availableRoom]) }) }
        : { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) };
    });

    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockAllocation]),
      }),
    });

    const result = await allocateRoom({
      studentUserId: 'student-1',
      roomId: 'room-1',
      allocatedBy: 'super-1',
    });

    expect(result).toEqual(mockAllocation);
    expect(result.status).toBe('ACTIVE');
  });

  it('inserts allocation with ACTIVE status', async () => {
    const availableRoom = { ...mockRoom, occupiedCount: 0, capacity: 3 };

    let callCount = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([availableRoom]) }) }
        : { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) };
    });

    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockAllocation]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    await allocateRoom({ studentUserId: 'student-1', roomId: 'room-1', allocatedBy: 'super-1' });

    const valuesMock = insertFn.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    const passedData = valuesMock.mock.calls[0]?.[0];
    expect(passedData.status).toBe('ACTIVE');
  });
});

// ---------------------------------------------------------------------------
// endAllocation
// ---------------------------------------------------------------------------

describe('endAllocation', () => {
  it('ends allocation and returns it', async () => {
    const ended = { ...mockAllocation, status: 'CHECKED_OUT', vacatedAt: new Date(), vacatedBy: 'super-1' };
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([ended]),
        }),
      }),
    });

    const result = await endAllocation('alloc-1', 'super-1');
    expect(result.status).toBe('CHECKED_OUT');
    expect(result.vacatedBy).toBe('super-1');
    expect(result.vacatedAt).toBeDefined();
  });

  it('throws NotFoundError when allocation does not exist', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(endAllocation('nonexistent', 'super-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('NotFoundError has status 404', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    try {
      await endAllocation('bad-id', 'super-1');
    } catch (err) {
      expect((err as NotFoundError).status).toBe(404);
      expect((err as NotFoundError).code).toBe('NOT_FOUND');
    }
  });

  it('sets CHECKED_OUT status in the update payload', async () => {
    const setFn = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockAllocation, status: 'CHECKED_OUT' }]),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setFn });

    await endAllocation('alloc-1', 'super-1');
    const setPayload = setFn.mock.calls[0]?.[0];
    expect(setPayload).toHaveProperty('status', 'CHECKED_OUT');
    expect(setPayload).toHaveProperty('vacatedAt');
    expect(setPayload).toHaveProperty('vacatedBy', 'super-1');
  });
});

// ---------------------------------------------------------------------------
// getStudentAllocation
// ---------------------------------------------------------------------------

describe('getStudentAllocation', () => {
  it('returns the active allocation for a student', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockAllocation]),
      }),
    });

    const result = await getStudentAllocation('student-1');
    expect(result).toEqual(mockAllocation);
  });

  it('returns null when student has no active allocation', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await getStudentAllocation('student-1');
    expect(result).toBeNull();
  });

  it('returns null (not undefined) for no allocation', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await getStudentAllocation('no-alloc-student');
    expect(result).toBeNull();
    expect(result).not.toBeUndefined();
  });

  it('does not throw for student with no allocation', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    await expect(getStudentAllocation('student-without-room')).resolves.toBeNull();
  });

  it('returns allocation with ACTIVE status', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockAllocation]),
      }),
    });

    const result = await getStudentAllocation('student-1');
    expect(result?.status).toBe('ACTIVE');
  });
});
