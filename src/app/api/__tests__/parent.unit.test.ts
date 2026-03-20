/**
 * Unit tests for parent-specific routes
 *
 * Covers:
 *   GET /api/parent/student       — linked students for the authenticated parent
 *   GET /api/parent/fees          — fees for linked students (with pagination)
 *   GET /api/parent/leave         — leave requests for linked students (with pagination)
 *   GET /api/parent/notifications — notifications for parent + linked students (with pagination)
 *
 * All routes require auth but no role check — the parent lookup is by authUserId.
 * DB calls are mocked via the chain mock.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockRequireAuth, mockDbChain } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    innerJoin: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
  };
  Object.keys(chain).forEach((k) => chain[k].mockReturnValue(chain));

  return {
    mockRequireAuth: vi.fn(),
    mockDbChain: chain,
  };
});

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/db', () => ({
  db: mockDbChain,
}));

vi.mock('@/lib/db/schema', () => ({
  users: { authUserId: 'authUserId', id: 'id', mobile: 'mobile', parentMobile: 'parentMobile' },
  students: { userId: 'userId' },
  fees: { studentUserId: 'studentUserId', createdAt: 'createdAt' },
  leaveRequests: { studentUserId: 'studentUserId', createdAt: 'createdAt' },
  notifications: { userId: 'userId', createdAt: 'createdAt' },
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

import { GET as studentGet } from '../parent/student/route';
import { GET as feesGet } from '../parent/fees/route';
import { GET as leaveGet } from '../parent/leave/route';
import { GET as notificationsGet } from '../parent/notifications/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSession(userId = 'parent-auth-1') {
  return { user: { id: userId } };
}

function createGetRequest(url: string): NextRequest {
  const req = new Request(`http://localhost${url}`) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function resetDbChain() {
  Object.keys(mockDbChain).forEach((k) => {
    mockDbChain[k].mockReset();
    mockDbChain[k].mockReturnValue(mockDbChain);
  });
}

const fakeParentUser = {
  id: 'parent-db-id',
  authUserId: 'parent-auth-1',
  mobile: '+919876543210',
};

const fakeLinkedStudents = [
  {
    user: { id: 'student-1', parentMobile: '+919876543210', fullName: 'Alice Student' },
    student: { userId: 'student-1', course: 'B.Tech' },
  },
];

// ---------------------------------------------------------------------------
// GET /api/parent/student
// ---------------------------------------------------------------------------

describe('GET /api/parent/student', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns linked students for the authenticated parent', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('parent-auth-1'));

    // First: look up parent user by authUserId
    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      // Second: innerJoin students where parentMobile matches
      .mockResolvedValueOnce(fakeLinkedStudents);

    const req = createGetRequest('/api/parent/student');
    const res = await studentGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveLength(1);
    expect(body.data[0].user.fullName).toBe('Alice Student');
  });

  it('returns empty data array when parent has no linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([]); // no linked students

    const req = createGetRequest('/api/parent/student');
    const res = await studentGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 404 when parent user profile is not found', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('unknown-parent'));

    mockDbChain.where.mockResolvedValueOnce([]); // parent not found

    const req = createGetRequest('/api/parent/student');
    const res = await studentGet(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toMatch(/parent profile not found/i);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/parent/student');
    const res = await studentGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/parent/fees
// ---------------------------------------------------------------------------

describe('GET /api/parent/fees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns fees for linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    const fees = [
      { id: 'fee-1', studentUserId: 'student-1', amount: 15000, status: 'PAID' },
      { id: 'fee-2', studentUserId: 'student-1', amount: 15000, status: 'PENDING' },
    ];

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])                        // parent lookup
      .mockResolvedValueOnce([{ id: 'student-1' }]);                 // linked student IDs

    mockDbChain.offset.mockResolvedValueOnce(fees);

    const req = createGetRequest('/api/parent/fees');
    const res = await feesGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveLength(2);
  });

  it('returns empty data and total 0 when no linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([]); // no linked student IDs

    const req = createGetRequest('/api/parent/fees');
    const res = await feesGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('supports custom pagination page and limit', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([{ id: 'student-1' }]);

    mockDbChain.offset.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/parent/fees?page=2&limit=5');
    const res = await feesGet(req);

    expect(res.status).toBe(200);
  });

  it('returns 404 when parent profile is not found', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('unknown'));

    mockDbChain.where.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/parent/fees');
    const res = await feesGet(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/parent/fees');
    const res = await feesGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/parent/leave
// ---------------------------------------------------------------------------

describe('GET /api/parent/leave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns leave requests for linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    const leaves = [
      { id: 'leave-1', studentUserId: 'student-1', status: 'PENDING' },
      { id: 'leave-2', studentUserId: 'student-1', status: 'APPROVED' },
    ];

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([{ id: 'student-1' }]);

    mockDbChain.offset.mockResolvedValueOnce(leaves);

    const req = createGetRequest('/api/parent/leave');
    const res = await leaveGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveLength(2);
  });

  it('returns empty data and total 0 when no linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([]); // no linked students

    const req = createGetRequest('/api/parent/leave');
    const res = await leaveGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('supports custom page and limit', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([{ id: 'student-1' }]);

    mockDbChain.offset.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/parent/leave?page=3&limit=10');
    const res = await leaveGet(req);

    expect(res.status).toBe(200);
  });

  it('returns 404 when parent profile is not found', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('ghost-user'));

    mockDbChain.where.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/parent/leave');
    const res = await leaveGet(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/parent/leave');
    const res = await leaveGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/parent/notifications
// ---------------------------------------------------------------------------

describe('GET /api/parent/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDbChain();
  });

  it('returns notifications for parent and linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('parent-auth-1'));

    const notifs = [
      { id: 'notif-1', userId: 'parent-db-id', title: 'Fee reminder', read: false },
      { id: 'notif-2', userId: 'student-1', title: 'Leave approved', read: true },
    ];

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])         // parent lookup
      .mockResolvedValueOnce([{ id: 'student-1' }]);  // linked students

    mockDbChain.offset.mockResolvedValueOnce(notifs);

    const req = createGetRequest('/api/parent/notifications');
    const res = await notificationsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveLength(2);
  });

  it('includes the parent own userId in notification query even when no linked students', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('parent-auth-1'));

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([]); // no linked students — parent still gets own notifications

    const ownNotif = [{ id: 'notif-own', userId: 'parent-db-id', title: 'System notice', read: false }];
    mockDbChain.offset.mockResolvedValueOnce(ownNotif);

    const req = createGetRequest('/api/parent/notifications');
    const res = await notificationsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId).toBe('parent-db-id');
  });

  it('supports custom pagination', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.where
      .mockResolvedValueOnce([fakeParentUser])
      .mockResolvedValueOnce([{ id: 'student-1' }]);

    mockDbChain.offset.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/parent/notifications?page=2&limit=10');
    const res = await notificationsGet(req);

    expect(res.status).toBe(200);
  });

  it('returns 404 when parent profile is not found', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('no-profile'));

    mockDbChain.where.mockResolvedValueOnce([]);

    const req = createGetRequest('/api/parent/notifications');
    const res = await notificationsGet(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/parent/notifications');
    const res = await notificationsGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 500 when DB throws unexpectedly', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    mockDbChain.select.mockImplementationOnce(() => {
      throw new Error('Unexpected DB error');
    });

    const req = createGetRequest('/api/parent/notifications');
    const res = await notificationsGet(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('Unexpected DB error');
  });
});
