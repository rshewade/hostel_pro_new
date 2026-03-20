// @vitest-environment node
/**
 * Unit tests for room-related API routes:
 *   GET   /api/rooms                        — list rooms (multi-role)
 *   POST  /api/rooms                        — create room (SUPERINTENDENT, TRUSTEE)
 *   POST  /api/rooms/allocate               — allocate room (SUPERINTENDENT, TRUSTEE)
 *   GET   /api/allocations                  — list allocations (multi-role)
 *   POST  /api/allocations                  — create allocation (SUPERINTENDENT, TRUSTEE)
 *   GET   /api/allocations/[id]             — get allocation by id (any auth)
 *   PUT   /api/allocations/[id]             — update allocation fields (SUPERINTENDENT, TRUSTEE)
 *   POST  /api/allocations/[id]/vacate      — end/vacate allocation (SUPERINTENDENT, TRUSTEE)
 *
 * Auth and services are fully mocked — no real DB or side effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors';

// --- module mocks ----------------------------------------------------------

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/lib/services/rooms', () => ({
  listRooms: vi.fn(),
  createRoom: vi.fn(),
  allocateRoom: vi.fn(),
  getStudentAllocation: vi.fn(),
  endAllocation: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  roomAllocations: {
    id: 'id',
    status: 'status',
    roomId: 'room_id',
    allocatedAt: 'allocated_at',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import route handlers AFTER mocks
import { GET as getRooms, POST as postRoom } from '../rooms/route';
import { POST as postAllocate } from '../rooms/allocate/route';
import {
  GET as getAllocations,
  POST as postAllocation,
} from '../allocations/route';
import {
  GET as getAllocationById,
  PUT as putAllocation,
} from '../allocations/[id]/route';
import { POST as vacateAllocation } from '../allocations/[id]/vacate/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import {
  listRooms,
  createRoom,
  allocateRoom,
  getStudentAllocation,
  endAllocation,
} from '@/lib/services/rooms';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockListRooms = listRooms as ReturnType<typeof vi.fn>;
const mockCreateRoom = createRoom as ReturnType<typeof vi.fn>;
const mockAllocateRoom = allocateRoom as ReturnType<typeof vi.fn>;
const mockGetStudentAllocation = getStudentAllocation as ReturnType<typeof vi.fn>;
const mockEndAllocation = endAllocation as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

// ---------------------------------------------------------------------------

function createRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(`http://localhost${url}`, options) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function createJsonRequest(url: string, method: string, body: unknown): NextRequest {
  return createRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function fakeSession(authUserId = 'auth-super-1') {
  return { user: { id: authUserId, email: 'super@example.com' } };
}

// Drizzle select chain
function buildSelectChain(data: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(data),
  };
}

// Drizzle update chain
function buildUpdateChain(returning: unknown[]) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
}

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const STUDENT_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const ROOM_UUID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

const fakeRoom = {
  id: ROOM_UUID,
  roomNumber: '101',
  vertical: 'BOYS',
  block: 'A',
  floor: 1,
  capacity: 2,
  status: 'AVAILABLE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeRoomList = {
  data: [fakeRoom],
  total: 1,
  page: 1,
  limit: 20,
};

const fakeAllocation = {
  id: VALID_UUID,
  studentUserId: STUDENT_UUID,
  roomId: ROOM_UUID,
  allocatedBy: 'auth-super-1',
  status: 'ACTIVE',
  allocatedAt: new Date().toISOString(),
  checkInConfirmed: false,
  inventoryAcknowledged: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// GET /api/rooms
// ---------------------------------------------------------------------------

describe('GET /api/rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListRooms.mockResolvedValue(fakeRoomList);
  });

  it('returns room list for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/rooms');
    const res = await getRooms(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('returns room list for TRUSTEE role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/rooms');
    const res = await getRooms(req);

    expect(res.status).toBe(200);
  });

  it('returns room list for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/rooms');
    const res = await getRooms(req);

    expect(res.status).toBe(200);
  });

  it('scopes vertical to session for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/rooms?vertical=GIRLS');
    await getRooms(req);

    // SUPERINTENDENT always gets their own vertical
    expect(mockListRooms).toHaveBeenCalledWith(
      expect.objectContaining({ vertical: 'BOYS' }),
    );
  });

  it('allows TRUSTEE to filter by vertical query param', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/rooms?vertical=GIRLS');
    await getRooms(req);

    expect(mockListRooms).toHaveBeenCalledWith(
      expect.objectContaining({ vertical: 'GIRLS' }),
    );
  });

  it('passes status filter to listRooms', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/rooms?status=AVAILABLE');
    await getRooms(req);

    expect(mockListRooms).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'AVAILABLE' }),
    );
  });

  it('defaults to page=1 and limit=20', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/rooms');
    await getRooms(req);

    expect(mockListRooms).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/rooms');
    const res = await getRooms(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for disallowed role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError());

    const req = createRequest('/api/rooms');
    const res = await getRooms(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/rooms
// ---------------------------------------------------------------------------

describe('POST /api/rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRoom.mockResolvedValue(fakeRoom);
  });

  it('creates a room and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms', 'POST', {
      roomNumber: '101',
      vertical: 'BOYS',
      capacity: 2,
    });
    const res = await postRoom(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.roomNumber).toBe('101');
    expect(body.vertical).toBe('BOYS');
  });

  it('creates a room with optional block and floor fields', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createJsonRequest('/api/rooms', 'POST', {
      roomNumber: '201',
      vertical: 'GIRLS',
      capacity: 3,
      block: 'B',
      floor: 2,
    });
    const res = await postRoom(req);

    expect(res.status).toBe(201);
  });

  it('returns 400 when roomNumber is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms', 'POST', {
      vertical: 'BOYS',
      capacity: 2,
    });
    const res = await postRoom(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when capacity is not a positive integer', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms', 'POST', {
      roomNumber: '101',
      vertical: 'BOYS',
      capacity: -1,
    });
    const res = await postRoom(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid vertical value', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms', 'POST', {
      roomNumber: '101',
      vertical: 'INVALID',
      capacity: 2,
    });
    const res = await postRoom(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/rooms', 'POST', {
      roomNumber: '101',
      vertical: 'BOYS',
      capacity: 2,
    });
    const res = await postRoom(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/rooms', 'POST', {
      roomNumber: '101',
      vertical: 'BOYS',
      capacity: 2,
    });
    const res = await postRoom(req);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/rooms/allocate
// ---------------------------------------------------------------------------

describe('POST /api/rooms/allocate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllocateRoom.mockResolvedValue(fakeAllocation);
  });

  it('allocates a room and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms/allocate', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    const res = await postAllocate(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.studentUserId).toBe(STUDENT_UUID);
    expect(body.roomId).toBe(ROOM_UUID);
  });

  it('passes allocatedBy from the session user id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms/allocate', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    await postAllocate(req);

    expect(mockAllocateRoom).toHaveBeenCalledWith(
      expect.objectContaining({ allocatedBy: 'auth-super-1' }),
    );
  });

  it('returns 400 when studentUserId is not a valid UUID', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms/allocate', 'POST', {
      studentUserId: 'not-a-uuid',
      roomId: ROOM_UUID,
    });
    const res = await postAllocate(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when roomId is not a valid UUID', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/rooms/allocate', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: 'not-a-uuid',
    });
    const res = await postAllocate(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/rooms/allocate', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    const res = await postAllocate(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/rooms/allocate', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    const res = await postAllocate(req);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/allocations
// ---------------------------------------------------------------------------

describe('GET /api/allocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // For staff roles, the route uses raw db queries
    mockDb.select.mockReturnValue(buildSelectChain([fakeAllocation]));
    mockGetStudentAllocation.mockResolvedValue(fakeAllocation);
  });

  it('returns student own allocation for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/allocations');
    const res = await getAllocations(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  it('returns empty list for STUDENT with no allocation', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockGetStudentAllocation.mockResolvedValue(null);

    const req = createRequest('/api/allocations');
    const res = await getAllocations(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns paginated list for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    // Simulate the Promise.all — select is called twice (data + count)
    mockDb.select
      .mockReturnValueOnce(buildSelectChain([fakeAllocation]))
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 1 }]),
      });

    const req = createRequest('/api/allocations');
    const res = await getAllocations(req);

    expect(res.status).toBe(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/allocations');
    const res = await getAllocations(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'ACCOUNTS' is not authorized."));

    const req = createRequest('/api/allocations');
    const res = await getAllocations(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/allocations
// ---------------------------------------------------------------------------

describe('POST /api/allocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllocateRoom.mockResolvedValue(fakeAllocation);
  });

  it('creates allocation and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/allocations', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    const res = await postAllocation(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('ACTIVE');
  });

  it('passes allocatedBy from session user id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/allocations', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    await postAllocation(req);

    expect(mockAllocateRoom).toHaveBeenCalledWith(
      expect.objectContaining({ allocatedBy: 'auth-super-1' }),
    );
  });

  it('returns 400 for non-UUID studentUserId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/allocations', 'POST', {
      studentUserId: 'bad-id',
      roomId: ROOM_UUID,
    });
    const res = await postAllocation(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/allocations', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    const res = await postAllocation(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/allocations', 'POST', {
      studentUserId: STUDENT_UUID,
      roomId: ROOM_UUID,
    });
    const res = await postAllocation(req);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/allocations/[id]
// ---------------------------------------------------------------------------

describe('GET /api/allocations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([fakeAllocation]),
    });
  });

  it('returns allocation by id for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest(`/api/allocations/${VALID_UUID}`);
    const res = await getAllocationById(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(VALID_UUID);
    expect(body.status).toBe('ACTIVE');
  });

  it('returns 404 when allocation does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    const req = createRequest('/api/allocations/nonexistent-id');
    const res = await getAllocationById(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest(`/api/allocations/${VALID_UUID}`);
    const res = await getAllocationById(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/allocations/[id]
// ---------------------------------------------------------------------------

describe('PUT /api/allocations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnValue(buildUpdateChain([fakeAllocation]));
  });

  it('updates allocation notes and returns 200', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest(`/api/allocations/${VALID_UUID}`, 'PUT', {
      notes: 'Student checked in successfully',
    });
    const res = await putAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(200);
  });

  it('marks checkInConfirmed and returns 200', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const confirmed = { ...fakeAllocation, checkInConfirmed: true };
    mockDb.update.mockReturnValue(buildUpdateChain([confirmed]));

    const req = createJsonRequest(`/api/allocations/${VALID_UUID}`, 'PUT', {
      checkInConfirmed: true,
    });
    const res = await putAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checkInConfirmed).toBe(true);
  });

  it('marks inventoryAcknowledged and returns 200', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    const acknowledged = { ...fakeAllocation, inventoryAcknowledged: true };
    mockDb.update.mockReturnValue(buildUpdateChain([acknowledged]));

    const req = createJsonRequest(`/api/allocations/${VALID_UUID}`, 'PUT', {
      inventoryAcknowledged: true,
    });
    const res = await putAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(200);
  });

  it('returns 404 when allocation does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockDb.update.mockReturnValue(buildUpdateChain([]));

    const req = createJsonRequest('/api/allocations/nonexistent-id', 'PUT', {
      notes: 'Test',
    });
    const res = await putAllocation(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest(`/api/allocations/${VALID_UUID}`, 'PUT', {
      notes: 'Test',
    });
    const res = await putAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest(`/api/allocations/${VALID_UUID}`, 'PUT', {
      notes: 'Test',
    });
    const res = await putAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/allocations/[id]/vacate
// ---------------------------------------------------------------------------

describe('POST /api/allocations/[id]/vacate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEndAllocation.mockResolvedValue({ ...fakeAllocation, status: 'CHECKED_OUT' });
  });

  it('vacates allocation and returns 200 with CHECKED_OUT status', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest(`/api/allocations/${VALID_UUID}/vacate`, { method: 'POST' });
    const res = await vacateAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('CHECKED_OUT');
  });

  it('calls endAllocation with id and session user id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest(`/api/allocations/${VALID_UUID}/vacate`, { method: 'POST' });
    await vacateAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(mockEndAllocation).toHaveBeenCalledWith(VALID_UUID, 'auth-super-1');
  });

  it('returns 404 when allocation does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockEndAllocation.mockRejectedValue(new NotFoundError('Allocation not found'));

    const req = createRequest('/api/allocations/nonexistent-id/vacate', { method: 'POST' });
    const res = await vacateAllocation(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createRequest(`/api/allocations/${VALID_UUID}/vacate`, { method: 'POST' });
    const res = await vacateAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest(`/api/allocations/${VALID_UUID}/vacate`, { method: 'POST' });
    const res = await vacateAllocation(req, { params: Promise.resolve({ id: VALID_UUID }) });

    expect(res.status).toBe(401);
  });
});
