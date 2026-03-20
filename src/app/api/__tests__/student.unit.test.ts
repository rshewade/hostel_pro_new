/**
 * Unit tests for student exit-request routes
 *
 * Covers:
 *   GET  /api/student/exit-request
 *   POST /api/student/exit-request
 *   GET  /api/student/exit-request/draft
 *   POST /api/student/exit-request/withdraw
 *
 * Auth and all DB calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

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
    delete: vi.fn(),
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
  exitRequests: {},
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

import { GET as exitGet, POST as exitPost } from '../student/exit-request/route';
import { GET as draftGet } from '../student/exit-request/draft/route';
import { POST as withdrawPost } from '../student/exit-request/withdraw/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSession(userId = 'student-auth-id') {
  return { user: { id: userId } };
}

function createGetRequest(url: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`));
}

function createPostRequest(url: string, body: unknown = {}): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`), {
    method: 'POST',
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

// ---------------------------------------------------------------------------
// GET /api/student/exit-request
// ---------------------------------------------------------------------------

describe('GET /api/student/exit-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it("returns the student's exit requests in descending order", async () => {
    const session = mockSession('student-1');
    mockRequireAuth.mockResolvedValue(session);
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: 'boys' });

    const records = [
      { id: 'exit-2', status: 'PENDING' },
      { id: 'exit-1', status: 'CANCELLED' },
    ];
    mockDbChain.orderBy.mockResolvedValueOnce(records);

    const req = createGetRequest('/api/student/exit-request');
    const res = await exitGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('exit-2');
  });

  it('returns empty data array when student has no exit requests', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    mockDbChain.orderBy.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/student/exit-request');
    const res = await exitGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/student/exit-request');
    const res = await exitGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for a non-STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'SUPERINTENDENT' is not authorized. Required: STUDENT"),
    );

    const req = createGetRequest('/api/student/exit-request');
    const res = await exitGet(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/student/exit-request
// ---------------------------------------------------------------------------

describe('POST /api/student/exit-request', () => {
  const validBody = {
    reason: 'Family emergency',
    expectedExitDate: '2026-04-01',
    forwardingAddress: '123 Main Street',
    bankAccountHolder: 'Alice Student',
    bankAccountNumber: '9876543210',
    bankIfscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('creates an exit request with valid data and returns 201', async () => {
    const session = mockSession('student-abc');
    mockRequireAuth.mockResolvedValue(session);
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: 'boys' });

    const created = { id: 'exit-new', studentUserId: 'student-abc', status: 'PENDING', ...validBody };
    mockDbChain.returning.mockResolvedValueOnce([created]);

    const req = createPostRequest('/api/student/exit-request', validBody);
    const res = await exitPost(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('exit-new');
    expect(body.status).toBe('PENDING');
  });

  it('sets status to PENDING on creation', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    mockDbChain.returning.mockResolvedValueOnce([{ id: 'exit-1', status: 'PENDING' }]);

    const req = createPostRequest('/api/student/exit-request', validBody);
    await exitPost(req);

    expect(mockDbChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
  });

  it('sets studentUserId from session user id', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('session-student-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    mockDbChain.returning.mockResolvedValueOnce([{ id: 'exit-1', status: 'PENDING' }]);

    const req = createPostRequest('/api/student/exit-request', validBody);
    await exitPost(req);

    expect(mockDbChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'session-student-id' }),
    );
  });

  it('accepts minimal required fields (reason and expectedExitDate only)', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    mockDbChain.returning.mockResolvedValueOnce([{ id: 'exit-min', status: 'PENDING' }]);

    const req = createPostRequest('/api/student/exit-request', {
      reason: 'Going home',
      expectedExitDate: '2026-05-01',
    });
    const res = await exitPost(req);

    expect(res.status).toBe(201);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPostRequest('/api/student/exit-request', validBody);
    const res = await exitPost(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for a non-STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'PARENT' is not authorized. Required: STUDENT"),
    );

    const req = createPostRequest('/api/student/exit-request', validBody);
    const res = await exitPost(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// GET /api/student/exit-request/draft
// ---------------------------------------------------------------------------

describe('GET /api/student/exit-request/draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns the pending draft exit request when one exists', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('student-x'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const draft = { id: 'exit-draft', status: 'PENDING', reason: 'Going home' };
    mockDbChain.limit.mockResolvedValueOnce([draft]);

    const req = createGetRequest('/api/student/exit-request/draft');
    const res = await draftGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).not.toBeNull();
    expect(body.data.id).toBe('exit-draft');
    expect(body.data.status).toBe('PENDING');
  });

  it('returns null when no pending draft exists', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    mockDbChain.limit.mockResolvedValueOnce([]); // no draft found

    const req = createGetRequest('/api/student/exit-request/draft');
    const res = await draftGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeNull();
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/student/exit-request/draft');
    const res = await draftGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for a non-STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'TRUSTEE' is not authorized. Required: STUDENT"),
    );

    const req = createGetRequest('/api/student/exit-request/draft');
    const res = await draftGet(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/student/exit-request/withdraw
// ---------------------------------------------------------------------------

describe('POST /api/student/exit-request/withdraw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('cancels the pending exit request and returns the updated record', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('student-y'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const cancelled = { id: 'exit-1', status: 'CANCELLED', studentUserId: 'student-y' };
    mockDbChain.returning.mockResolvedValueOnce([cancelled]);

    const req = createPostRequest('/api/student/exit-request/withdraw');
    const res = await withdrawPost(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('CANCELLED');
    expect(body.id).toBe('exit-1');
  });

  it('calls db.update().set() with status CANCELLED', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    mockDbChain.returning.mockResolvedValueOnce([{ id: 'exit-1', status: 'CANCELLED' }]);

    const req = createPostRequest('/api/student/exit-request/withdraw');
    await withdrawPost(req);

    expect(mockDbChain.set).toHaveBeenCalledWith({ status: 'CANCELLED' });
  });

  it('returns 404 when no pending exit request exists to withdraw', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('student-no-pending'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    mockDbChain.returning.mockResolvedValueOnce([]); // no record updated

    const req = createPostRequest('/api/student/exit-request/withdraw');
    const res = await withdrawPost(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toMatch(/no pending exit request found to withdraw/i);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPostRequest('/api/student/exit-request/withdraw');
    const res = await withdrawPost(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for a non-STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'ACCOUNTS' is not authorized. Required: STUDENT"),
    );

    const req = createPostRequest('/api/student/exit-request/withdraw');
    const res = await withdrawPost(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});
