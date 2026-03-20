/**
 * Unit tests for interview routes
 *
 * Covers:
 *   GET  /api/interviews          — list with filters (status, applicationId, pagination)
 *   POST /api/interviews          — create interview
 *   GET  /api/interviews/[id]     — get by id
 *   PUT  /api/interviews/[id]     — update by id
 *   POST /api/interviews/[id]/complete — complete interview (guards: already-completed, cancelled)
 *   GET  /api/interviews/slots    — list available slots with filters
 *
 * Auth and all DB calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockRequireAuth, mockRequireRole, mockDbChain } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    returning: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    groupBy: vi.fn(),
  };
  Object.keys(chain).forEach((k) => chain[k].mockReturnValue(chain));

  return {
    mockRequireAuth: vi.fn(),
    mockRequireRole: vi.fn(),
    mockDbChain: chain,
  };
});

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: mockRequireAuth,
  requireRole: mockRequireRole,
}));

vi.mock('@/lib/db', () => ({
  db: mockDbChain,
}));

vi.mock('@/lib/db/schema', () => ({
  interviews: {
    id: 'id',
    status: 'status',
    applicationId: 'applicationId',
    scheduledDate: 'scheduledDate',
  },
  interviewSlots: {
    isAvailable: 'isAvailable',
    slotDate: 'slotDate',
    startTime: 'startTime',
    vertical: 'vertical',
    mode: 'mode',
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET as listGet, POST as createPost } from '../interviews/route';
import { GET as getById, PUT as updateById } from '../interviews/[id]/route';
import { POST as completePost } from '../interviews/[id]/complete/route';
import { GET as slotsGet } from '../interviews/slots/route';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSession(userId = 'auth-user-1') {
  return { user: { id: userId } };
}

function createGetRequest(url: string): NextRequest {
  const req = new Request(`http://localhost${url}`) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function createPostRequest(url: string, body: unknown = {}): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createPutRequest(url: string, body: unknown = {}): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function resetDbChain() {
  Object.keys(mockDbChain).forEach((k) => {
    mockDbChain[k].mockReset();
    mockDbChain[k].mockReturnValue(mockDbChain);
  });
}

/**
 * The GET /api/interviews route uses Promise.all([data_query, count_query]).
 * Both queries start with db.select() — so we need to return a fresh chain
 * per call, where the data chain resolves at .orderBy() and the count chain
 * resolves at .where().
 *
 * Route data query:  db.select().from().where().limit().offset().orderBy() -> rows
 * Route count query: db.select({total:count()}).from().where()             -> [{total}]
 */
function setupListDbMock(data: unknown[], total: number) {
  const dbMock = db as unknown as { select: ReturnType<typeof vi.fn> };

  const dataChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(data),
  };

  const countChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ total }]),
  };

  dbMock.select
    .mockReturnValueOnce(dataChain)
    .mockReturnValueOnce(countChain);
}

// ---------------------------------------------------------------------------
// GET /api/interviews
// ---------------------------------------------------------------------------

describe('GET /api/interviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns paginated interviews for SUPERINTENDENT', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const interviews = [
      { id: 'iv-1', status: 'SCHEDULED', applicationId: 'app-1' },
      { id: 'iv-2', status: 'COMPLETED', applicationId: 'app-2' },
    ];
    setupListDbMock(interviews, 2);

    const req = createGetRequest('/api/interviews');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it('returns paginated interviews for TRUSTEE', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    setupListDbMock([{ id: 'iv-1', status: 'SCHEDULED' }], 1);

    const req = createGetRequest('/api/interviews');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  it('returns paginated interviews for STUDENT', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    setupListDbMock([], 0);

    const req = createGetRequest('/api/interviews');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('filters by status query param', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    setupListDbMock([{ id: 'iv-1', status: 'SCHEDULED' }], 1);

    const req = createGetRequest('/api/interviews?status=SCHEDULED');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe('SCHEDULED');
  });

  it('filters by applicationId query param', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    setupListDbMock([{ id: 'iv-1', applicationId: 'app-xyz' }], 1);

    const req = createGetRequest('/api/interviews?applicationId=app-xyz');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].applicationId).toBe('app-xyz');
  });

  it('supports custom pagination page and limit', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    setupListDbMock([], 50);

    const req = createGetRequest('/api/interviews?page=3&limit=5');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(3);
    expect(body.limit).toBe(5);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/interviews');
    const res = await listGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'ACCOUNTS' is not authorized. Required: SUPERINTENDENT, TRUSTEE, STUDENT"),
    );

    const req = createGetRequest('/api/interviews');
    const res = await listGet(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/interviews
// ---------------------------------------------------------------------------

describe('POST /api/interviews', () => {
  const validBody = {
    applicationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    scheduledDate: '2026-04-15',
    scheduledTime: '10:30',
    mode: 'IN_PERSON',
    location: 'Admin Office Room 2',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('creates an interview and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const created = { id: 'iv-new', status: 'SCHEDULED', ...validBody };
    mockDbChain.returning.mockResolvedValueOnce([created]);

    const req = createPostRequest('/api/interviews', validBody);
    const res = await createPost(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('iv-new');
    expect(body.status).toBe('SCHEDULED');
  });

  it('sets status to SCHEDULED on creation', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    mockDbChain.returning.mockResolvedValueOnce([{ id: 'iv-1', status: 'SCHEDULED' }]);

    const req = createPostRequest('/api/interviews', validBody);
    await createPost(req);

    expect(mockDbChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SCHEDULED' }),
    );
  });

  it('defaults mode to IN_PERSON when not specified', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    mockDbChain.returning.mockResolvedValueOnce([{ id: 'iv-1', status: 'SCHEDULED', mode: 'IN_PERSON' }]);

    const req = createPostRequest('/api/interviews', {
      applicationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      scheduledDate: '2026-05-01',
      scheduledTime: '14:00',
    });
    const res = await createPost(req);

    expect(res.status).toBe(201);
  });

  it('accepts ONLINE mode with meetingLink', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    mockDbChain.returning.mockResolvedValueOnce([{ id: 'iv-2', status: 'SCHEDULED', mode: 'ONLINE' }]);

    const req = createPostRequest('/api/interviews', {
      ...validBody,
      mode: 'ONLINE',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
    });
    const res = await createPost(req);

    expect(res.status).toBe(201);
  });

  it('returns 400 when applicationId is not a UUID', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createPostRequest('/api/interviews', {
      ...validBody,
      applicationId: 'not-a-uuid',
    });
    const res = await createPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when required fields are missing', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createPostRequest('/api/interviews', {});
    const res = await createPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPostRequest('/api/interviews', validBody);
    const res = await createPost(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized. Required: SUPERINTENDENT, TRUSTEE"),
    );

    const req = createPostRequest('/api/interviews', validBody);
    const res = await createPost(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// GET /api/interviews/[id]
// ---------------------------------------------------------------------------

describe('GET /api/interviews/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns the interview when found', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    const interview = { id: 'iv-1', status: 'SCHEDULED', applicationId: 'app-1' };
    mockDbChain.where.mockResolvedValueOnce([interview]);

    const req = createGetRequest('/api/interviews/iv-1');
    const res = await getById(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('iv-1');
    expect(body.status).toBe('SCHEDULED');
  });

  it('returns 404 when interview does not exist', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.where.mockResolvedValueOnce([]); // not found

    const req = createGetRequest('/api/interviews/nonexistent');
    const res = await getById(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toMatch(/interview not found/i);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/interviews/iv-1');
    const res = await getById(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/interviews/[id]
// ---------------------------------------------------------------------------

describe('PUT /api/interviews/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('updates and returns the interview', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const updated = { id: 'iv-1', status: 'RESCHEDULED', notes: 'Moved to next week' };
    mockDbChain.returning.mockResolvedValueOnce([updated]);

    const req = createPutRequest('/api/interviews/iv-1', { notes: 'Moved to next week', status: 'RESCHEDULED' });
    const res = await updateById(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('RESCHEDULED');
    expect(body.notes).toBe('Moved to next week');
  });

  it('recomputes scheduleDatetime when scheduledDate changes', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    // The PUT route does:
    //   1. db.select().from().where()  -> [existing]  (to get current date/time)
    //   2. db.update().set().where().returning() -> [updated]
    // We set up the select chain to resolve at .where(), then the update
    // goes through the shared mockDbChain which terminates at .returning().
    const existing = { id: 'iv-1', scheduledDate: '2026-04-10', scheduledTime: '09:00', status: 'SCHEDULED' };

    const dbMock = db as unknown as { select: ReturnType<typeof vi.fn> };
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([existing]),
    };
    dbMock.select.mockReturnValueOnce(selectChain);

    const updated = { id: 'iv-1', scheduledDate: '2026-04-20', scheduledTime: '09:00', status: 'SCHEDULED' };
    mockDbChain.returning.mockResolvedValueOnce([updated]);

    const req = createPutRequest('/api/interviews/iv-1', { scheduledDate: '2026-04-20' });
    const res = await updateById(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(200);
    // scheduleDatetime should have been included in set()
    expect(mockDbChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ scheduleDatetime: expect.any(Date) }),
    );
  });

  it('returns 404 when interview not found on update', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    mockDbChain.returning.mockResolvedValueOnce([]); // no row updated

    const req = createPutRequest('/api/interviews/missing-id', { notes: 'test' });
    const res = await updateById(req, { params: Promise.resolve({ id: 'missing-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid status value', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createPutRequest('/api/interviews/iv-1', { status: 'INVALID_STATUS' });
    const res = await updateById(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPutRequest('/api/interviews/iv-1', { notes: 'x' });
    const res = await updateById(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized. Required: SUPERINTENDENT, TRUSTEE"),
    );

    const req = createPutRequest('/api/interviews/iv-1', { notes: 'x' });
    const res = await updateById(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/interviews/[id]/complete
// ---------------------------------------------------------------------------

describe('POST /api/interviews/[id]/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('completes a SCHEDULED interview and returns it', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const existing = { id: 'iv-1', status: 'SCHEDULED', notes: null, internalRemarks: null };
    mockDbChain.where.mockResolvedValueOnce([existing]);

    const completed = { id: 'iv-1', status: 'COMPLETED', finalScore: 85 };
    mockDbChain.returning.mockResolvedValueOnce([completed]);

    const req = createPostRequest('/api/interviews/iv-1/complete', { finalScore: 85 });
    const res = await completePost(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('COMPLETED');
    expect(body.finalScore).toBe(85);
  });

  it('sets status to COMPLETED in the DB update', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const existing = { id: 'iv-1', status: 'SCHEDULED', notes: null, internalRemarks: null };
    mockDbChain.where.mockResolvedValueOnce([existing]);
    mockDbChain.returning.mockResolvedValueOnce([{ id: 'iv-1', status: 'COMPLETED' }]);

    const req = createPostRequest('/api/interviews/iv-1/complete', { notes: 'Good candidate' });
    await completePost(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(mockDbChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'COMPLETED' }),
    );
  });

  it('returns 400 when interview is already COMPLETED', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const existing = { id: 'iv-1', status: 'COMPLETED', notes: null, internalRemarks: null };
    mockDbChain.where.mockResolvedValueOnce([existing]);

    const req = createPostRequest('/api/interviews/iv-1/complete', {});
    const res = await completePost(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toMatch(/already completed/i);
  });

  it('returns 400 when interview is CANCELLED', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const existing = { id: 'iv-2', status: 'CANCELLED', notes: null, internalRemarks: null };
    mockDbChain.where.mockResolvedValueOnce([existing]);

    const req = createPostRequest('/api/interviews/iv-2/complete', {});
    const res = await completePost(req, { params: Promise.resolve({ id: 'iv-2' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toMatch(/cannot complete a cancelled/i);
  });

  it('returns 404 when interview does not exist', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    mockDbChain.where.mockResolvedValueOnce([]); // not found

    const req = createPostRequest('/api/interviews/missing-id/complete', {});
    const res = await completePost(req, { params: Promise.resolve({ id: 'missing-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 when finalScore is out of range', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createPostRequest('/api/interviews/iv-1/complete', { finalScore: 150 });
    const res = await completePost(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPostRequest('/api/interviews/iv-1/complete', {});
    const res = await completePost(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized. Required: SUPERINTENDENT, TRUSTEE"),
    );

    const req = createPostRequest('/api/interviews/iv-1/complete', {});
    const res = await completePost(req, { params: Promise.resolve({ id: 'iv-1' }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// GET /api/interviews/slots
// ---------------------------------------------------------------------------

describe('GET /api/interviews/slots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns available slots without filters', async () => {
    const slots = [
      { id: 'slot-1', slotDate: '2026-04-20', startTime: '09:00', isAvailable: true },
      { id: 'slot-2', slotDate: '2026-04-20', startTime: '11:00', isAvailable: true },
    ];
    mockDbChain.orderBy.mockResolvedValueOnce(slots);

    const req = createGetRequest('/api/interviews/slots');
    const res = await slotsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].isAvailable).toBe(true);
  });

  it('filters by fromDate', async () => {
    const slots = [{ id: 'slot-3', slotDate: '2026-05-01', startTime: '10:00', isAvailable: true }];
    mockDbChain.orderBy.mockResolvedValueOnce(slots);

    const req = createGetRequest('/api/interviews/slots?fromDate=2026-05-01');
    const res = await slotsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('filters by vertical', async () => {
    const slots = [{ id: 'slot-4', slotDate: '2026-04-25', vertical: 'BOYS', isAvailable: true }];
    mockDbChain.orderBy.mockResolvedValueOnce(slots);

    const req = createGetRequest('/api/interviews/slots?vertical=BOYS');
    const res = await slotsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].vertical).toBe('BOYS');
  });

  it('filters by mode', async () => {
    const slots = [{ id: 'slot-5', mode: 'ONLINE', isAvailable: true }];
    mockDbChain.orderBy.mockResolvedValueOnce(slots);

    const req = createGetRequest('/api/interviews/slots?mode=ONLINE');
    const res = await slotsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  it('returns empty array when no available slots', async () => {
    mockDbChain.orderBy.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/interviews/slots');
    const res = await slotsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('supports combined filters (fromDate + vertical + mode)', async () => {
    mockDbChain.orderBy.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/interviews/slots?fromDate=2026-06-01&vertical=GIRLS&mode=IN_PERSON');
    const res = await slotsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 500 when DB throws', async () => {
    mockDbChain.select.mockImplementationOnce(() => {
      throw new Error('DB connection failed');
    });

    const req = createGetRequest('/api/interviews/slots');
    const res = await slotsGet(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
