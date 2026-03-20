/**
 * Unit tests for notification routes
 *
 * Covers:
 *   GET   /api/notifications             — list paginated notifications for current user
 *   PATCH /api/notifications/[id]/read   — mark single notification as read
 *   PATCH /api/notifications/read-all    — mark all notifications as read
 *   GET   /api/notifications/unread-count — unread count for current user
 *
 * Auth and service calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, NotFoundError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

const {
  mockRequireAuth,
  mockListNotifications,
  mockMarkAsRead,
  mockMarkAllAsRead,
  mockGetUnreadCount,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockListNotifications: vi.fn(),
  mockMarkAsRead: vi.fn(),
  mockMarkAllAsRead: vi.fn(),
  mockGetUnreadCount: vi.fn(),
}));

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/services/notifications', () => ({
  listNotifications: mockListNotifications,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
  getUnreadCount: mockGetUnreadCount,
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

import { GET as listGet } from '../notifications/route';
import { PATCH as markReadPatch } from '../notifications/[id]/read/route';
import { PATCH as markAllPatch } from '../notifications/read-all/route';
import { GET as unreadCountGet } from '../notifications/unread-count/route';

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

function createPatchRequest(url: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`), {
    method: 'PATCH',
  });
}

const fakeNotifications = [
  {
    id: 'notif-1',
    userId: 'auth-user-1',
    title: 'Fee reminder',
    message: 'Your fee is due in 3 days',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'auth-user-1',
    title: 'Leave approved',
    message: 'Your leave request has been approved',
    read: true,
    createdAt: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// GET /api/notifications
// ---------------------------------------------------------------------------

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated notifications for the authenticated user', async () => {
    const session = mockSession('auth-user-1');
    mockRequireAuth.mockResolvedValue(session);
    mockListNotifications.mockResolvedValue({
      data: fakeNotifications,
      total: 2,
      page: 1,
      limit: 20,
    });

    const req = createGetRequest('/api/notifications');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it('calls listNotifications with the session userId', async () => {
    const session = mockSession('specific-user-id');
    mockRequireAuth.mockResolvedValue(session);
    mockListNotifications.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    const req = createGetRequest('/api/notifications');
    await listGet(req);

    expect(mockListNotifications).toHaveBeenCalledWith('specific-user-id', 1, 20);
  });

  it('passes custom page and limit to listNotifications', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockListNotifications.mockResolvedValue({ data: [], total: 100, page: 2, limit: 10 });

    const req = createGetRequest('/api/notifications?page=2&limit=10');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.limit).toBe(10);
    expect(mockListNotifications).toHaveBeenCalledWith(expect.any(String), 2, 10);
  });

  it('returns empty data array when user has no notifications', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockListNotifications.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    const req = createGetRequest('/api/notifications');
    const res = await listGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/notifications');
    const res = await listGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 500 when service throws unexpectedly', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockListNotifications.mockRejectedValue(new Error('DB timeout'));

    const req = createGetRequest('/api/notifications');
    const res = await listGet(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('DB timeout');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/notifications/[id]/read
// ---------------------------------------------------------------------------

describe('PATCH /api/notifications/[id]/read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the notification as read and returns it', async () => {
    const session = mockSession('user-1');
    mockRequireAuth.mockResolvedValue(session);

    const updated = { ...fakeNotifications[0], read: true, readAt: new Date().toISOString() };
    mockMarkAsRead.mockResolvedValue(updated);

    const req = createPatchRequest('/api/notifications/notif-1/read');
    const res = await markReadPatch(req, { params: Promise.resolve({ id: 'notif-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('notif-1');
    expect(body.read).toBe(true);
  });

  it('calls markAsRead with the notification id and session userId', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('session-user'));
    mockMarkAsRead.mockResolvedValue({ id: 'notif-1', read: true });

    const req = createPatchRequest('/api/notifications/notif-1/read');
    await markReadPatch(req, { params: Promise.resolve({ id: 'notif-1' }) });

    expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1', 'session-user');
  });

  it('returns 404 when notification does not exist or belongs to another user', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockMarkAsRead.mockRejectedValue(new NotFoundError('Notification not found'));

    const req = createPatchRequest('/api/notifications/nonexistent/read');
    const res = await markReadPatch(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toMatch(/notification not found/i);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPatchRequest('/api/notifications/notif-1/read');
    const res = await markReadPatch(req, { params: Promise.resolve({ id: 'notif-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/notifications/read-all
// ---------------------------------------------------------------------------

describe('PATCH /api/notifications/read-all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks all notifications as read and returns success', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('user-2'));
    mockMarkAllAsRead.mockResolvedValue(undefined);

    const req = createPatchRequest('/api/notifications/read-all');
    const res = await markAllPatch(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('calls markAllAsRead with the session userId', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('user-abc'));
    mockMarkAllAsRead.mockResolvedValue(undefined);

    const req = createPatchRequest('/api/notifications/read-all');
    await markAllPatch(req);

    expect(mockMarkAllAsRead).toHaveBeenCalledWith('user-abc');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPatchRequest('/api/notifications/read-all');
    const res = await markAllPatch(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 500 when service throws unexpectedly', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockMarkAllAsRead.mockRejectedValue(new Error('DB write failed'));

    const req = createPatchRequest('/api/notifications/read-all');
    const res = await markAllPatch(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// GET /api/notifications/unread-count
// ---------------------------------------------------------------------------

describe('GET /api/notifications/unread-count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the unread count for the authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('user-3'));
    mockGetUnreadCount.mockResolvedValue(5);

    const req = createGetRequest('/api/notifications/unread-count');
    const res = await unreadCountGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(5);
  });

  it('calls getUnreadCount with the session userId', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('count-user'));
    mockGetUnreadCount.mockResolvedValue(3);

    const req = createGetRequest('/api/notifications/unread-count');
    await unreadCountGet(req);

    expect(mockGetUnreadCount).toHaveBeenCalledWith('count-user');
  });

  it('returns count of 0 when all notifications are read', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockGetUnreadCount.mockResolvedValue(0);

    const req = createGetRequest('/api/notifications/unread-count');
    const res = await unreadCountGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/notifications/unread-count');
    const res = await unreadCountGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 500 when service throws unexpectedly', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockGetUnreadCount.mockRejectedValue(new Error('Cache miss'));

    const req = createGetRequest('/api/notifications/unread-count');
    const res = await unreadCountGet(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
