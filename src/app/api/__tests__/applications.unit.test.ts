// @vitest-environment node
/**
 * Unit tests for application API routes:
 *   GET   /api/applications               — list applications (multi-role)
 *   POST  /api/applications               — create application (any auth)
 *   GET   /api/applications/[id]          — get by id (any auth)
 *   PATCH /api/applications/[id]          — update application fields (STUDENT, SUPERINTENDENT, TRUSTEE)
 *   PATCH /api/applications/[id]/status  — transition status (SUPERINTENDENT, TRUSTEE only)
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

vi.mock('@/lib/services/applications', () => ({
  listApplications: vi.fn(),
  createApplication: vi.fn(),
  getApplicationById: vi.fn(),
  updateApplication: vi.fn(),
  updateApplicationStatus: vi.fn(),
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
import { GET as listApplications, POST as postApplication } from '../applications/route';
import { GET as getApplication, PATCH as patchApplication } from '../applications/[id]/route';
import { PATCH as patchStatus } from '../applications/[id]/status/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import {
  listApplications as listApplicationsService,
  createApplication,
  getApplicationById,
  updateApplication,
  updateApplicationStatus,
} from '@/lib/services/applications';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockListApplications = listApplicationsService as ReturnType<typeof vi.fn>;
const mockCreateApplication = createApplication as ReturnType<typeof vi.fn>;
const mockGetApplicationById = getApplicationById as ReturnType<typeof vi.fn>;
const mockUpdateApplication = updateApplication as ReturnType<typeof vi.fn>;
const mockUpdateApplicationStatus = updateApplicationStatus as ReturnType<typeof vi.fn>;

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

const fakeApp = {
  id: 'app-uuid-1',
  studentUserId: 'auth-user-1',
  applicantName: 'John Doe',
  applicantMobile: '+919876543210',
  applicantEmail: 'john@example.com',
  dateOfBirth: '2000-01-01',
  gender: 'MALE',
  vertical: 'BOYS',
  type: 'NEW',
  status: 'SUBMITTED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeAppList = {
  data: [fakeApp],
  total: 1,
  page: 1,
  limit: 20,
};

// ---------------------------------------------------------------------------
// GET /api/applications
// ---------------------------------------------------------------------------

describe('GET /api/applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListApplications.mockResolvedValue(fakeAppList);
  });

  it('returns application list for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/applications');
    const res = await listApplications(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('returns application list for STUDENT role (own applications)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/applications');
    const res = await listApplications(req);

    expect(res.status).toBe(200);
  });

  it('passes userId, role, and vertical to listApplications', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/applications');
    await listApplications(req);

    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'auth-super-1',
        userRole: 'SUPERINTENDENT',
        userVertical: 'BOYS',
      }),
    );
  });

  it('passes status filter when provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/applications?status=APPROVED');
    await listApplications(req);

    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'APPROVED' }),
    );
  });

  it('passes type filter when provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/applications?type=RENEWAL');
    await listApplications(req);

    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'RENEWAL' }),
    );
  });

  it('defaults to page=1 and limit=20', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/applications');
    await listApplications(req);

    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('supports custom pagination', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/applications?page=2&limit=5');
    await listApplications(req);

    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
    );
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/applications');
    const res = await listApplications(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for disallowed role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError());

    const req = createRequest('/api/applications');
    const res = await listApplications(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/applications
// ---------------------------------------------------------------------------

describe('POST /api/applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateApplication.mockResolvedValue(fakeApp);
  });

  it('creates application and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'John Doe',
      applicantMobile: '+919876543210',
      dateOfBirth: '2000-01-01',
      gender: 'MALE',
      vertical: 'BOYS',
    });
    const res = await postApplication(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.applicantName).toBe('John Doe');
    expect(body.status).toBe('SUBMITTED');
  });

  it('sets studentUserId from session on creation', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'Jane Doe',
      applicantMobile: '+919876543211',
      dateOfBirth: '2001-06-15',
      gender: 'FEMALE',
      vertical: 'GIRLS',
    });
    await postApplication(req);

    expect(mockCreateApplication).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'auth-user-1' }),
    );
  });

  it('defaults type to NEW when not specified', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'Raj Kumar',
      applicantMobile: '+919876543212',
      dateOfBirth: '1999-03-10',
      gender: 'MALE',
      vertical: 'BOYS',
    });
    await postApplication(req);

    expect(mockCreateApplication).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'NEW' }),
    );
  });

  it('creates RENEWAL type application when specified', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'Raj Kumar',
      applicantMobile: '+919876543212',
      dateOfBirth: '1999-03-10',
      gender: 'MALE',
      vertical: 'BOYS',
      type: 'RENEWAL',
    });
    await postApplication(req);

    expect(mockCreateApplication).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'RENEWAL' }),
    );
  });

  it('returns 400 when applicantName is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantMobile: '+919876543210',
      dateOfBirth: '2000-01-01',
      gender: 'MALE',
      vertical: 'BOYS',
    });
    const res = await postApplication(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when applicantMobile is too short', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'John',
      applicantMobile: '123',
      dateOfBirth: '2000-01-01',
      gender: 'MALE',
      vertical: 'BOYS',
    });
    const res = await postApplication(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid vertical value', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'John',
      applicantMobile: '+919876543210',
      dateOfBirth: '2000-01-01',
      gender: 'MALE',
      vertical: 'INVALID_VERTICAL',
    });
    const res = await postApplication(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid type value', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'John',
      applicantMobile: '+919876543210',
      dateOfBirth: '2000-01-01',
      gender: 'MALE',
      vertical: 'BOYS',
      type: 'INVALID_TYPE',
    });
    const res = await postApplication(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/applications', 'POST', {
      applicantName: 'John',
      applicantMobile: '+919876543210',
      dateOfBirth: '2000-01-01',
      gender: 'MALE',
      vertical: 'BOYS',
    });
    const res = await postApplication(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/applications/[id]
// ---------------------------------------------------------------------------

describe('GET /api/applications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApplicationById.mockResolvedValue(fakeApp);
  });

  it('returns application by id for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest('/api/applications/app-uuid-1');
    const res = await getApplication(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('app-uuid-1');
    expect(body.applicantName).toBe('John Doe');
  });

  it('calls getApplicationById with the path param id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest('/api/applications/app-uuid-1');
    await getApplication(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(mockGetApplicationById).toHaveBeenCalledWith('app-uuid-1');
  });

  it('returns 404 when application does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockGetApplicationById.mockRejectedValue(new NotFoundError('Application not found'));

    const req = createRequest('/api/applications/nonexistent-id');
    const res = await getApplication(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/applications/app-uuid-1');
    const res = await getApplication(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/applications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateApplication.mockResolvedValue({ ...fakeApp, applicantEmail: 'updated@example.com' });
  });

  it('updates application fields for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/applications/app-uuid-1', 'PATCH', {
      applicantEmail: 'updated@example.com',
    });
    const res = await patchApplication(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.applicantEmail).toBe('updated@example.com');
  });

  it('calls updateApplication with id, body, and role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/applications/app-uuid-1', 'PATCH', {
      applicantName: 'New Name',
    });
    await patchApplication(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(mockUpdateApplication).toHaveBeenCalledWith(
      'app-uuid-1',
      expect.objectContaining({ applicantName: 'New Name' }),
      'SUPERINTENDENT',
    );
  });

  it('returns 404 when application does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockUpdateApplication.mockRejectedValue(new NotFoundError('Application not found'));

    const req = createJsonRequest('/api/applications/nonexistent-id', 'PATCH', {
      applicantName: 'X',
    });
    const res = await patchApplication(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'ACCOUNTS' is not authorized."));

    const req = createJsonRequest('/api/applications/app-uuid-1', 'PATCH', {
      applicantName: 'X',
    });
    const res = await patchApplication(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/applications/app-uuid-1', 'PATCH', {});
    const res = await patchApplication(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id]/status
// ---------------------------------------------------------------------------

describe('PATCH /api/applications/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateApplicationStatus.mockResolvedValue({ ...fakeApp, status: 'APPROVED' });
  });

  it('approves application for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('APPROVED');
  });

  it('rejects application with a reason', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockUpdateApplicationStatus.mockResolvedValue({ ...fakeApp, status: 'REJECTED' });

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'REJECTED',
      reason: 'Capacity full',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('REJECTED');
  });

  it('calls updateApplicationStatus with id, status, userId, and reason', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'REVIEW',
      reason: 'Needs more documents',
    });
    await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(mockUpdateApplicationStatus).toHaveBeenCalledWith(
      'app-uuid-1',
      'REVIEW',
      'auth-super-1',
      'Needs more documents',
    );
  });

  it('transitions to SUBMITTED status', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockUpdateApplicationStatus.mockResolvedValue({ ...fakeApp, status: 'SUBMITTED' });

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'SUBMITTED',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid status value', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'INVALID_STATUS',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when status is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      reason: 'Some reason',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(400);
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'ACCOUNTS' is not authorized."));

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/applications/app-uuid-1/status', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'app-uuid-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when application does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockUpdateApplicationStatus.mockRejectedValue(new NotFoundError('Application not found'));

    const req = createJsonRequest('/api/applications/nonexistent-id/status', 'PATCH', {
      status: 'APPROVED',
    });
    const res = await patchStatus(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
