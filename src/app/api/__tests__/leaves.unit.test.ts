// @vitest-environment node
/**
 * Unit tests for leave API routes:
 *   GET   /api/leaves          — list leaves with filters/stats (multi-role)
 *   POST  /api/leaves          — create leave request (STUDENT only)
 *   GET   /api/leaves/[id]     — get leave by id (any auth)
 *   PATCH /api/leaves/[id]     — update leave status: approve/reject/cancel
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

vi.mock('@/lib/services/leaves', () => ({
  listLeaves: vi.fn(),
  createLeaveRequest: vi.fn(),
  getLeaveById: vi.fn(),
  updateLeaveStatus: vi.fn(),
  getLeaveStats: vi.fn(),
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
import { GET as getLeaves, POST as postLeave } from '../leaves/route';
import { GET as getLeaveById, PATCH as patchLeave } from '../leaves/[id]/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import {
  listLeaves,
  createLeaveRequest,
  getLeaveById as getLeaveByIdService,
  updateLeaveStatus,
  getLeaveStats,
} from '@/lib/services/leaves';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockListLeaves = listLeaves as ReturnType<typeof vi.fn>;
const mockCreateLeaveRequest = createLeaveRequest as ReturnType<typeof vi.fn>;
const mockGetLeaveById = getLeaveByIdService as ReturnType<typeof vi.fn>;
const mockUpdateLeaveStatus = updateLeaveStatus as ReturnType<typeof vi.fn>;
const mockGetLeaveStats = getLeaveStats as ReturnType<typeof vi.fn>;

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

function fakeSession(authUserId = 'auth-user-1') {
  return { user: { id: authUserId, email: 'user@example.com' } };
}

const fakeLeave = {
  id: 'leave-uuid-1',
  studentUserId: 'auth-user-1',
  type: 'HOME_VISIT',
  startTime: new Date('2026-04-01T09:00:00Z').toISOString(),
  endTime: new Date('2026-04-03T18:00:00Z').toISOString(),
  reason: 'Family function',
  destination: 'Jaipur',
  emergencyContact: '+919876543210',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeLeaveList = {
  data: [fakeLeave],
  total: 1,
  page: 1,
  limit: 20,
};

const fakeStats = {
  total: 10,
  pending: 3,
  approved: 5,
  rejected: 2,
  byVertical: { BOYS: 7, GIRLS: 3 },
};

// ---------------------------------------------------------------------------
// GET /api/leaves
// ---------------------------------------------------------------------------

describe('GET /api/leaves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListLeaves.mockResolvedValue(fakeLeaveList);
    mockGetLeaveStats.mockResolvedValue(fakeStats);
  });

  it('returns leave list for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/leaves');
    const res = await getLeaves(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('returns leave list for STUDENT (scoped to own leaves)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/leaves');
    const res = await getLeaves(req);

    expect(res.status).toBe(200);
  });

  it('forces studentUserId to session user id for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/leaves?studentUserId=someone-else');
    await getLeaves(req);

    expect(mockListLeaves).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'auth-student-1' }),
    );
  });

  it('passes studentUserId filter for staff roles', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/leaves?studentUserId=auth-student-1');
    await getLeaves(req);

    expect(mockListLeaves).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'auth-student-1' }),
    );
  });

  it('returns stats when stats=true query param is provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/leaves?stats=true');
    const res = await getLeaves(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(10);
    expect(body.pending).toBe(3);
    expect(mockGetLeaveStats).toHaveBeenCalled();
    expect(mockListLeaves).not.toHaveBeenCalled();
  });

  it('passes status filter to listLeaves', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/leaves?status=PENDING');
    await getLeaves(req);

    expect(mockListLeaves).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
  });

  it('defaults to page=1 and limit=20', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/leaves');
    await getLeaves(req);

    expect(mockListLeaves).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('supports custom pagination', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/leaves?page=3&limit=10');
    await getLeaves(req);

    expect(mockListLeaves).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, limit: 10 }),
    );
  });

  it('returns leave list for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-parent-1'));
    mockRequireRole.mockResolvedValue({ role: 'PARENT', vertical: null });

    const req = createRequest('/api/leaves');
    const res = await getLeaves(req);

    expect(res.status).toBe(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/leaves');
    const res = await getLeaves(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'ACCOUNTS' is not authorized."));

    const req = createRequest('/api/leaves');
    const res = await getLeaves(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/leaves
// ---------------------------------------------------------------------------

describe('POST /api/leaves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLeaveRequest.mockResolvedValue(fakeLeave);
  });

  it('creates a leave request and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'HOME_VISIT',
      startTime: '2026-04-01T09:00:00Z',
      endTime: '2026-04-03T18:00:00Z',
      reason: 'Family function',
      destination: 'Jaipur',
    });
    const res = await postLeave(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.type).toBe('HOME_VISIT');
    expect(body.reason).toBe('Family function');
  });

  it('sets studentUserId from session on creation', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'MEDICAL',
      startTime: '2026-04-05T08:00:00Z',
      endTime: '2026-04-06T20:00:00Z',
      reason: 'Doctor appointment',
    });
    await postLeave(req);

    expect(mockCreateLeaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'auth-student-1' }),
    );
  });

  it('converts startTime and endTime strings to Date objects', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'SHORT_LEAVE',
      startTime: '2026-04-10T10:00:00Z',
      endTime: '2026-04-10T18:00:00Z',
      reason: 'Personal work',
    });
    await postLeave(req);

    expect(mockCreateLeaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: expect.any(Date),
        endTime: expect.any(Date),
      }),
    );
  });

  it('creates EMERGENCY leave with optional emergencyContact', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'EMERGENCY',
      startTime: '2026-04-01T09:00:00Z',
      endTime: '2026-04-02T18:00:00Z',
      reason: 'Family emergency',
      emergencyContact: '+919876543210',
    });
    const res = await postLeave(req);

    expect(res.status).toBe(201);
  });

  it('returns 400 when type is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/leaves', 'POST', {
      startTime: '2026-04-01T09:00:00Z',
      endTime: '2026-04-03T18:00:00Z',
      reason: 'Some reason',
    });
    const res = await postLeave(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid type enum', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'VACATION',
      startTime: '2026-04-01T09:00:00Z',
      endTime: '2026-04-03T18:00:00Z',
      reason: 'Holiday',
    });
    const res = await postLeave(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when reason is empty string', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'HOME_VISIT',
      startTime: '2026-04-01T09:00:00Z',
      endTime: '2026-04-03T18:00:00Z',
      reason: '',
    });
    const res = await postLeave(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 for SUPERINTENDENT role (student-only endpoint)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'SUPERINTENDENT' is not authorized."));

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'HOME_VISIT',
      startTime: '2026-04-01T09:00:00Z',
      endTime: '2026-04-03T18:00:00Z',
      reason: 'Visit family',
    });
    const res = await postLeave(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/leaves', 'POST', {
      type: 'HOME_VISIT',
      startTime: '2026-04-01T09:00:00Z',
      endTime: '2026-04-03T18:00:00Z',
      reason: 'Visit family',
    });
    const res = await postLeave(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/leaves/[id]
// ---------------------------------------------------------------------------

describe('GET /api/leaves/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLeaveById.mockResolvedValue(fakeLeave);
  });

  it('returns leave by id for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest('/api/leaves/leave-uuid-1');
    const res = await getLeaveById(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('leave-uuid-1');
    expect(body.type).toBe('HOME_VISIT');
  });

  it('calls getLeaveById with the path param id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest('/api/leaves/leave-uuid-1');
    await getLeaveById(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(mockGetLeaveById).toHaveBeenCalledWith('leave-uuid-1');
  });

  it('returns 404 when leave does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockGetLeaveById.mockRejectedValue(new NotFoundError('Leave not found'));

    const req = createRequest('/api/leaves/nonexistent-id');
    const res = await getLeaveById(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/leaves/leave-uuid-1');
    const res = await getLeaveById(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/leaves/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/leaves/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateLeaveStatus.mockResolvedValue({ ...fakeLeave, status: 'APPROVED' });
  });

  it('approves leave for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('APPROVED');
  });

  it('rejects leave with a reason', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockUpdateLeaveStatus.mockResolvedValue({ ...fakeLeave, status: 'REJECTED' });

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'REJECTED',
      reason: 'Exam period',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('REJECTED');
  });

  it('allows STUDENT to cancel their own leave', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockUpdateLeaveStatus.mockResolvedValue({ ...fakeLeave, status: 'CANCELLED' });

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'CANCELLED',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('CANCELLED');
  });

  it('calls updateLeaveStatus with id, status, userId, and reason', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'APPROVED',
      reason: 'Documents verified',
    });
    await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(mockUpdateLeaveStatus).toHaveBeenCalledWith(
      'leave-uuid-1',
      'APPROVED',
      'auth-super-1',
      'Documents verified',
    );
  });

  it('returns 400 for invalid status value', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'PENDING',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when status is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      reason: 'Some reason',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(400);
  });

  it('returns 404 when leave does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockUpdateLeaveStatus.mockRejectedValue(new NotFoundError('Leave not found'));

    const req = createJsonRequest('/api/leaves/nonexistent-id', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'ACCOUNTS' is not authorized."));

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('allows TRUSTEE role to approve leaves', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-trustee-1'));
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createJsonRequest('/api/leaves/leave-uuid-1', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchLeave(req, { params: Promise.resolve({ id: 'leave-uuid-1' }) });

    expect(res.status).toBe(200);
  });
});
