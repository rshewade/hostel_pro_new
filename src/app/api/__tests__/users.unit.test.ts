// @vitest-environment node
/**
 * Unit tests for user API routes:
 *   GET   /api/users             — list all users (staff roles only)
 *   GET   /api/users/profile     — get current user's profile
 *   PATCH /api/users/profile     — update current user's profile
 *
 * Auth, services, and DB are fully mocked — no real DB connection is made.
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

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: {
    createdAt: 'created_at',
  },
}));

vi.mock('@/lib/services/users', () => ({
  getUserByAuthId: vi.fn(),
  updateUserProfile: vi.fn(),
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
import { GET as getUsers } from '../users/route';
import { GET as getProfile, PATCH as patchProfile } from '../users/profile/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { getUserByAuthId, updateUserProfile } from '@/lib/services/users';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockGetUserByAuthId = getUserByAuthId as ReturnType<typeof vi.fn>;
const mockUpdateUserProfile = updateUserProfile as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> };

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

// Drizzle select chain that resolves via .orderBy()
function buildSelectChain(data: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(data),
  };
}

const fakeUser = {
  id: 'user-uuid-1',
  authUserId: 'auth-user-1',
  fullName: 'Test Student',
  phone: '+919876543210',
  email: 'student@example.com',
  role: 'STUDENT',
  vertical: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeStaffUser = {
  ...fakeUser,
  id: 'user-uuid-2',
  authUserId: 'auth-super-1',
  fullName: 'Test Superintendent',
  role: 'SUPERINTENDENT',
  vertical: 'BOYS',
};

// ---------------------------------------------------------------------------
// GET /api/users
// ---------------------------------------------------------------------------

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(buildSelectChain([fakeUser, fakeStaffUser]));
  });

  it('returns user list for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/users');
    const res = await getUsers(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it('returns user list for TRUSTEE role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/users');
    const res = await getUsers(req);

    expect(res.status).toBe(200);
  });

  it('returns user list for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createRequest('/api/users');
    const res = await getUsers(req);

    expect(res.status).toBe(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/users');
    const res = await getUsers(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createRequest('/api/users');
    const res = await getUsers(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'PARENT' is not authorized."));

    const req = createRequest('/api/users');
    const res = await getUsers(req);

    expect(res.status).toBe(403);
  });

  it('returns empty array when no users exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    mockDb.select.mockReturnValue(buildSelectChain([]));

    const req = createRequest('/api/users');
    const res = await getUsers(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/profile
// ---------------------------------------------------------------------------

describe('GET /api/users/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserByAuthId.mockResolvedValue(fakeUser);
  });

  it('returns the authenticated user profile', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createRequest('/api/users/profile');
    const res = await getProfile(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fullName).toBe('Test Student');
    expect(body.phone).toBe('+919876543210');
  });

  it('calls getUserByAuthId with the session user id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createRequest('/api/users/profile');
    await getProfile(req);

    expect(mockGetUserByAuthId).toHaveBeenCalledWith('auth-user-1');
  });

  it('returns 404 when profile is not found', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('unknown-auth-id'));
    mockGetUserByAuthId.mockRejectedValue(new NotFoundError('User not found'));

    const req = createRequest('/api/users/profile');
    const res = await getProfile(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/users/profile');
    const res = await getProfile(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/users/profile
// ---------------------------------------------------------------------------

describe('PATCH /api/users/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUserProfile.mockResolvedValue({ ...fakeUser, fullName: 'Updated Name' });
  });

  it('updates user profile and returns 200', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createJsonRequest('/api/users/profile', 'PATCH', {
      fullName: 'Updated Name',
    });
    const res = await patchProfile(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fullName).toBe('Updated Name');
  });

  it('calls updateUserProfile with session user id and the request body', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createJsonRequest('/api/users/profile', 'PATCH', {
      fullName: 'New Name',
      email: 'new@example.com',
    });
    await patchProfile(req);

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      'auth-user-1',
      expect.objectContaining({ fullName: 'New Name', email: 'new@example.com' }),
    );
  });

  it('returns 404 when the user profile does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('unknown-auth-id'));
    mockUpdateUserProfile.mockRejectedValue(new NotFoundError('User not found'));

    const req = createJsonRequest('/api/users/profile', 'PATCH', { fullName: 'X' });
    const res = await patchProfile(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/users/profile', 'PATCH', { fullName: 'Y' });
    const res = await patchProfile(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('can update just the email field', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));
    mockUpdateUserProfile.mockResolvedValue({ ...fakeUser, email: 'updated@example.com' });

    const req = createJsonRequest('/api/users/profile', 'PATCH', { email: 'updated@example.com' });
    const res = await patchProfile(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('updated@example.com');
  });
});
