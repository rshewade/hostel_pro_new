/**
 * Unit tests for dashboard routes
 *
 * Covers:
 *   GET /api/dashboard/superintendent — applicationStats + leaveStats (role: SUPERINTENDENT)
 *   GET /api/dashboard/accounts       — feeTotals + paymentStats (role: ACCOUNTS)
 *   GET /api/dashboard/student        — paymentSummary + roomAllocation + unreadNotifications (role: STUDENT)
 *   GET /api/dashboard/parent         — students + recentFees + recentLeaves (no role check; parent lookup by authUserId)
 *   GET /api/dashboard/trustee        — applicationStats + pendingInterviews (role: TRUSTEE)
 *
 * Auth, role checks, service calls, and DB calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

const {
  mockRequireAuth,
  mockRequireRole,
  mockGetApplicationStats,
  mockGetLeaveStats,
  mockGetPaymentSummary,
  mockGetStudentAllocation,
  mockGetUnreadCount,
  mockDbChain,
} = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    innerJoin: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    groupBy: vi.fn(),
  };
  Object.keys(chain).forEach((k) => chain[k].mockReturnValue(chain));

  return {
    mockRequireAuth: vi.fn(),
    mockRequireRole: vi.fn(),
    mockGetApplicationStats: vi.fn(),
    mockGetLeaveStats: vi.fn(),
    mockGetPaymentSummary: vi.fn(),
    mockGetStudentAllocation: vi.fn(),
    mockGetUnreadCount: vi.fn(),
    mockDbChain: chain,
  };
});

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: mockRequireAuth,
  requireRole: mockRequireRole,
}));

vi.mock('@/lib/services/applications', () => ({
  getApplicationStats: mockGetApplicationStats,
}));

vi.mock('@/lib/services/leaves', () => ({
  getLeaveStats: mockGetLeaveStats,
}));

vi.mock('@/lib/services/payments', () => ({
  getPaymentSummary: mockGetPaymentSummary,
}));

vi.mock('@/lib/services/rooms', () => ({
  getStudentAllocation: mockGetStudentAllocation,
}));

vi.mock('@/lib/services/notifications', () => ({
  getUnreadCount: mockGetUnreadCount,
}));

vi.mock('@/lib/db', () => ({
  db: mockDbChain,
}));

vi.mock('@/lib/db/schema', () => ({
  users: { authUserId: 'authUserId', id: 'id', mobile: 'mobile', parentMobile: 'parentMobile' },
  students: { userId: 'userId' },
  fees: { studentUserId: 'studentUserId', status: 'status', amount: 'amount', createdAt: 'createdAt' },
  payments: { status: 'status', amount: 'amount' },
  leaveRequests: { studentUserId: 'studentUserId', createdAt: 'createdAt' },
  interviews: { status: 'status' },
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

import { GET as superintendentGet } from '../dashboard/superintendent/route';
import { GET as accountsGet } from '../dashboard/accounts/route';
import { GET as studentGet } from '../dashboard/student/route';
import { GET as parentGet } from '../dashboard/parent/route';
import { GET as trusteeGet } from '../dashboard/trustee/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSession(userId = 'auth-user-1') {
  return { user: { id: userId } };
}

function createGetRequest(url = '/api/dashboard'): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`));
}

function resetDbChain() {
  Object.keys(mockDbChain).forEach((k) => {
    mockDbChain[k].mockReset();
    mockDbChain[k].mockReturnValue(mockDbChain);
  });
}

// ---------------------------------------------------------------------------
// GET /api/dashboard/superintendent
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/superintendent', () => {
  const fakeAppStats = { pending: 5, approved: 10, rejected: 2 };
  const fakeLeaveStats = { pending: 3, approved: 8 };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns applicationStats and leaveStats for SUPERINTENDENT', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockGetApplicationStats.mockResolvedValue(fakeAppStats);
    mockGetLeaveStats.mockResolvedValue(fakeLeaveStats);

    const res = await superintendentGet(createGetRequest('/api/dashboard/superintendent'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('applicationStats');
    expect(body).toHaveProperty('leaveStats');
    expect(body.applicationStats).toEqual(fakeAppStats);
    expect(body.leaveStats).toEqual(fakeLeaveStats);
  });

  it('passes role and vertical to getApplicationStats', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'GIRLS' });
    mockGetApplicationStats.mockResolvedValue(fakeAppStats);
    mockGetLeaveStats.mockResolvedValue(fakeLeaveStats);

    await superintendentGet(createGetRequest('/api/dashboard/superintendent'));

    expect(mockGetApplicationStats).toHaveBeenCalledWith('SUPERINTENDENT', 'GIRLS');
  });

  it('passes vertical to getLeaveStats', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockGetApplicationStats.mockResolvedValue(fakeAppStats);
    mockGetLeaveStats.mockResolvedValue(fakeLeaveStats);

    await superintendentGet(createGetRequest('/api/dashboard/superintendent'));

    expect(mockGetLeaveStats).toHaveBeenCalledWith('BOYS');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const res = await superintendentGet(createGetRequest('/api/dashboard/superintendent'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'ACCOUNTS' is not authorized. Required: SUPERINTENDENT"),
    );

    const res = await superintendentGet(createGetRequest('/api/dashboard/superintendent'));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized. Required: SUPERINTENDENT"),
    );

    const res = await superintendentGet(createGetRequest('/api/dashboard/superintendent'));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/accounts
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns feeTotals and paymentStats for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const feeTotals = [
      { status: 'PAID', count: 10, totalAmount: '50000' },
      { status: 'PENDING', count: 5, totalAmount: '25000' },
    ];
    const paymentStats = [
      { status: 'CAPTURED', count: 8, totalAmount: '40000' },
    ];

    // Promise.all([feeTotals, paymentStats]) — both use groupBy as terminal
    mockDbChain.groupBy
      .mockResolvedValueOnce(feeTotals)
      .mockResolvedValueOnce(paymentStats);

    const res = await accountsGet(createGetRequest('/api/dashboard/accounts'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('feeTotals');
    expect(body).toHaveProperty('paymentStats');
    expect(body.feeTotals).toHaveProperty('PAID');
    expect(body.feeTotals.PAID.count).toBe(10);
    expect(body.paymentStats).toHaveProperty('CAPTURED');
  });

  it('returns empty objects when no fees or payments exist', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    mockDbChain.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await accountsGet(createGetRequest('/api/dashboard/accounts'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.feeTotals).toEqual({});
    expect(body.paymentStats).toEqual({});
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const res = await accountsGet(createGetRequest('/api/dashboard/accounts'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'SUPERINTENDENT' is not authorized. Required: ACCOUNTS"),
    );

    const res = await accountsGet(createGetRequest('/api/dashboard/accounts'));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/student
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/student', () => {
  const fakePaymentSummary = { totalDue: 15000, totalPaid: 10000, nextDueDate: '2026-05-01' };
  const fakeRoomAllocation = { roomId: 'room-1', roomNumber: '101', bedNumber: 'A' };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns paymentSummary, roomAllocation, and unreadNotifications for STUDENT', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('student-auth'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockGetPaymentSummary.mockResolvedValue(fakePaymentSummary);
    mockGetStudentAllocation.mockResolvedValue(fakeRoomAllocation);
    mockGetUnreadCount.mockResolvedValue(3);

    const res = await studentGet(createGetRequest('/api/dashboard/student'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('paymentSummary');
    expect(body).toHaveProperty('roomAllocation');
    expect(body).toHaveProperty('unreadNotifications');
    expect(body.paymentSummary).toEqual(fakePaymentSummary);
    expect(body.roomAllocation).toEqual(fakeRoomAllocation);
    expect(body.unreadNotifications).toBe(3);
  });

  it('calls services with the session userId', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('student-123'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockGetPaymentSummary.mockResolvedValue(fakePaymentSummary);
    mockGetStudentAllocation.mockResolvedValue(fakeRoomAllocation);
    mockGetUnreadCount.mockResolvedValue(0);

    await studentGet(createGetRequest('/api/dashboard/student'));

    expect(mockGetPaymentSummary).toHaveBeenCalledWith('student-123');
    expect(mockGetStudentAllocation).toHaveBeenCalledWith('student-123');
    expect(mockGetUnreadCount).toHaveBeenCalledWith('student-123');
  });

  it('returns 0 unreadNotifications when all are read', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockGetPaymentSummary.mockResolvedValue(fakePaymentSummary);
    mockGetStudentAllocation.mockResolvedValue(null);
    mockGetUnreadCount.mockResolvedValue(0);

    const res = await studentGet(createGetRequest('/api/dashboard/student'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unreadNotifications).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const res = await studentGet(createGetRequest('/api/dashboard/student'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'PARENT' is not authorized. Required: STUDENT"),
    );

    const res = await studentGet(createGetRequest('/api/dashboard/student'));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/parent
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/parent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns students, recentFees, and recentLeaves for a parent with linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('parent-auth'));

    const parentUser = { id: 'parent-db-id', mobile: '+919876543210', authUserId: 'parent-auth' };
    const linkedStudents = [{ user: { id: 'student-1', parentMobile: '+919876543210' }, student: {} }];
    const recentFees = [{ id: 'fee-1', studentUserId: 'student-1' }];
    const recentLeaves = [{ id: 'leave-1', studentUserId: 'student-1' }];

    // Call sequence: users by authUserId, innerJoin students, fees, leaveRequests
    mockDbChain.where
      .mockResolvedValueOnce([parentUser])       // parent lookup
      .mockResolvedValueOnce(linkedStudents);    // linked students

    mockDbChain.limit
      .mockResolvedValueOnce(recentFees)         // fees
      .mockResolvedValueOnce(recentLeaves);      // leaves

    const res = await parentGet(createGetRequest('/api/dashboard/parent'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('students');
    expect(body).toHaveProperty('recentFees');
    expect(body).toHaveProperty('recentLeaves');
  });

  it('returns empty arrays when parent has no linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('parent-auth-2'));

    const parentUser = { id: 'parent-2', mobile: '+910000000000', authUserId: 'parent-auth-2' };

    mockDbChain.where
      .mockResolvedValueOnce([parentUser])
      .mockResolvedValueOnce([]); // no linked students

    const res = await parentGet(createGetRequest('/api/dashboard/parent'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.students).toEqual([]);
    expect(body.recentFees).toEqual([]);
    expect(body.recentLeaves).toEqual([]);
  });

  it('returns 404 when parent user profile is not found', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('unknown-auth'));

    mockDbChain.where.mockResolvedValueOnce([]); // parent not in users table

    const res = await parentGet(createGetRequest('/api/dashboard/parent'));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toMatch(/parent profile not found/i);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const res = await parentGet(createGetRequest('/api/dashboard/parent'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/dashboard/trustee
// ---------------------------------------------------------------------------

describe('GET /api/dashboard/trustee', () => {
  const fakeAppStats = { pending: 12, approved: 30, rejected: 5 };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns applicationStats and pendingInterviews for TRUSTEE', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    mockGetApplicationStats.mockResolvedValue(fakeAppStats);

    // Promise.all([getApplicationStats, db.select...where]) — DB call resolves [{count: 4}]
    mockDbChain.where.mockResolvedValueOnce([{ count: 4 }]);

    const res = await trusteeGet(createGetRequest('/api/dashboard/trustee'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('applicationStats');
    expect(body).toHaveProperty('pendingInterviews');
    expect(body.applicationStats).toEqual(fakeAppStats);
    expect(body.pendingInterviews).toBe(4);
  });

  it('returns 0 pendingInterviews when none are scheduled', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    mockGetApplicationStats.mockResolvedValue(fakeAppStats);

    mockDbChain.where.mockResolvedValueOnce([{ count: 0 }]);

    const res = await trusteeGet(createGetRequest('/api/dashboard/trustee'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pendingInterviews).toBe(0);
  });

  it('passes role and vertical to getApplicationStats', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: 'BOYS' });
    mockGetApplicationStats.mockResolvedValue(fakeAppStats);
    mockDbChain.where.mockResolvedValueOnce([{ count: 1 }]);

    await trusteeGet(createGetRequest('/api/dashboard/trustee'));

    expect(mockGetApplicationStats).toHaveBeenCalledWith('TRUSTEE', 'BOYS');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const res = await trusteeGet(createGetRequest('/api/dashboard/trustee'));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'SUPERINTENDENT' is not authorized. Required: TRUSTEE"),
    );

    const res = await trusteeGet(createGetRequest('/api/dashboard/trustee'));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized. Required: TRUSTEE"),
    );

    const res = await trusteeGet(createGetRequest('/api/dashboard/trustee'));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});
