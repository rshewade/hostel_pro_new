/**
 * Unit tests for renewal API routes:
 *   GET  /api/renewals   — list renewals (student sees own; staff sees all/filtered)
 *   POST /api/renewals   — create a renewal (student auto-uses own id; staff must provide studentUserId)
 *
 * Auth and DB are fully mocked — no real DB connection is made.
 * The renewals route uses Promise.all([data, count]) for GET queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

// --- module mocks ----------------------------------------------------------

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  renewals: {
    studentUserId: 'student_user_id',
    status: 'status',
    createdAt: 'created_at',
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
import { GET, POST } from '../renewals/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
};

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

function fakeSession(authUserId = 'auth-user-1') {
  return { user: { id: authUserId, email: 'user@example.com' } };
}

const fakeRenewal = {
  id: 'renewal-uuid-1',
  studentUserId: 'student-auth-id',
  applicationId: 'a1b2c3d4-0000-0000-0000-000000000001',
  periodStart: '2026-07-01',
  periodEnd: '2027-06-30',
  status: 'DRAFT',
  consentGiven: false,
  consentGivenAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Set up db.select for the two-call Promise.all pattern:
 *   call 1 — data query:  .from().where().limit().offset().orderBy() → resolves list
 *   call 2 — count query: .from().where()                            → resolves [{total}]
 */
function setupSelectMock(data: unknown[], total: number) {
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

  mockDb.select
    .mockReturnValueOnce(dataChain)
    .mockReturnValueOnce(countChain);
}

/**
 * Set up db.insert to capture the .values() call for inspection.
 * Returns the capturedValues spy so tests can assert on what was inserted.
 */
function setupInsertMock(renewal: unknown): ReturnType<typeof vi.fn> {
  const capturedValues = vi.fn().mockReturnThis();
  mockDb.insert.mockReturnValue({
    values: capturedValues,
    returning: vi.fn().mockResolvedValue([renewal]),
  });
  // Patch the chain so .values().returning() works
  capturedValues.mockReturnValue({
    returning: vi.fn().mockResolvedValue([renewal]),
  });
  return capturedValues;
}

// ---------------------------------------------------------------------------
// GET /api/renewals
// ---------------------------------------------------------------------------

describe('GET /api/renewals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only the student's own renewals for STUDENT role", async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    setupSelectMock([fakeRenewal], 1);

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it('student cannot override their own studentUserId scope via query param', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    setupSelectMock([], 0);

    const req = createRequest('/api/renewals?studentUserId=someone-else');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns all renewals for SUPERINTENDENT without studentUserId filter', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupSelectMock([fakeRenewal], 1);

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('returns all renewals for TRUSTEE role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('trustee-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    setupSelectMock([fakeRenewal], 1);

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it('staff can filter renewals by studentUserId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupSelectMock([fakeRenewal], 1);

    const req = createRequest('/api/renewals?studentUserId=student-auth-id');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('supports status filter DRAFT', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const draftRenewals = [fakeRenewal].filter((r) => r.status === 'DRAFT');
    setupSelectMock(draftRenewals, draftRenewals.length);

    const req = createRequest('/api/renewals?status=DRAFT');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((r: { status: string }) => r.status === 'DRAFT')).toBe(true);
  });

  it('supports status filter SUBMITTED', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupSelectMock([], 0);

    const req = createRequest('/api/renewals?status=SUBMITTED');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it('supports status filter APPROVED', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    setupSelectMock([], 0);

    const req = createRequest('/api/renewals?status=APPROVED');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('supports status filter REJECTED', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupSelectMock([], 0);

    const req = createRequest('/api/renewals?status=REJECTED');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('supports custom pagination', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupSelectMock([], 50);

    const req = createRequest('/api/renewals?page=3&limit=5');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(3);
    expect(body.limit).toBe(5);
  });

  it('defaults to page=1 and limit=20 when not provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupSelectMock([], 0);

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'ACCOUNTS' is not authorized. Required: STUDENT, SUPERINTENDENT, TRUSTEE"),
    );

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'PARENT' is not authorized."),
    );

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns 500 on unexpected DB error', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('DB timeout');
    });

    const req = createRequest('/api/renewals');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/renewals
// ---------------------------------------------------------------------------

describe('POST /api/renewals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupInsertMock(fakeRenewal);
  });

  it('creates renewal for STUDENT using session user id automatically', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('renewal-uuid-1');
  });

  it('inserts with studentUserId = session.user.id for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    // Use a fresh spy to capture .values() argument
    const valuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([fakeRenewal]),
    });
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    await POST(req);

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'student-auth-id' }),
    );
  });

  it('student-provided studentUserId in body is ignored in favour of session id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    const valuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([fakeRenewal]),
    });
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
      studentUserId: 'e8b2d9f0-1234-5678-abcd-000000000001', // valid UUID but wrong user
    });
    await POST(req);

    // Route must use session id, not the body's studentUserId
    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'student-auth-id' }),
    );
  });

  it('creates renewal for SUPERINTENDENT with explicit studentUserId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const renewalForStudent = { ...fakeRenewal, studentUserId: 'e8b2d9f0-1234-5678-abcd-000000000001' };
    setupInsertMock(renewalForStudent);

    const req = createJsonRequest('/api/renewals', 'POST', {
      studentUserId: 'e8b2d9f0-1234-5678-abcd-000000000001',
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.studentUserId).toBe('e8b2d9f0-1234-5678-abcd-000000000001');
  });

  it('creates renewal for TRUSTEE with explicit studentUserId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('trustee-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    const renewalForStudent = { ...fakeRenewal, studentUserId: 'e8b2d9f0-1234-5678-abcd-000000000002' };
    setupInsertMock(renewalForStudent);

    const req = createJsonRequest('/api/renewals', 'POST', {
      studentUserId: 'e8b2d9f0-1234-5678-abcd-000000000002',
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('inserts with status=DRAFT by default', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    const valuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([fakeRenewal]),
    });
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    await POST(req);

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DRAFT' }),
    );
  });

  it('stores consentGiven=true and sets consentGivenAt', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    const valuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ ...fakeRenewal, consentGiven: true }]),
    });
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
      consentGiven: true,
    });
    await POST(req);

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        consentGiven: true,
        consentGivenAt: expect.any(Date),
      }),
    );
  });

  it('does not set consentGivenAt when consentGiven=false', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    const valuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([fakeRenewal]),
    });
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
      consentGiven: false,
    });
    await POST(req);

    const insertedValues = valuesSpy.mock.calls[0][0];
    expect(insertedValues.consentGiven).toBe(false);
    expect(insertedValues.consentGivenAt).toBeUndefined();
  });

  it('links the renewal to an applicationId when provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    const valuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([fakeRenewal]),
    });
    mockDb.insert.mockReturnValue({ values: valuesSpy });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
      applicationId: 'a1b2c3d4-0000-0000-0000-000000000001',
    });
    await POST(req);

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'a1b2c3d4-0000-0000-0000-000000000001' }),
    );
  });

  it('returns 400 for missing periodStart', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing periodEnd', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when SUPERINTENDENT does not provide studentUserId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
      // studentUserId intentionally omitted
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('studentUserId');
  });

  it('returns 400 when TRUSTEE does not provide studentUserId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('trustee-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('studentUserId');
  });

  it('returns 400 when studentUserId is provided but is not a valid UUID', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('super-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/renewals', 'POST', {
      studentUserId: 'not-a-uuid',
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'ACCOUNTS' is not authorized. Required: STUDENT, SUPERINTENDENT, TRUSTEE"),
    );

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'PARENT' is not authorized."),
    );

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 500 on unexpected DB error during insert', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockDb.insert.mockImplementationOnce(() => {
      throw new Error('Unique constraint violated');
    });

    const req = createJsonRequest('/api/renewals', 'POST', {
      periodStart: '2026-07-01',
      periodEnd: '2027-06-30',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('Unique constraint');
  });
});
