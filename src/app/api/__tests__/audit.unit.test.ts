/**
 * Unit tests for audit and compliance log API routes:
 *   GET /api/auditLogs                           — paginated audit log list (staff only)
 *   GET /api/audit/entity/[type]/[id]            — logs for a specific entity
 *   GET /api/compliance/audit                    — filtered compliance audit logs
 *
 * Auth, audit service, and DB are fully mocked — no real DB connection is made.
 * auditLogs route uses Promise.all([data, count]) — db.select is called twice per request.
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
  },
}));

vi.mock('@/lib/db/schema', () => ({
  auditLogs: {
    entityType: 'entity_type',
    actorId: 'actor_id',
    createdAt: 'created_at',
  },
}));

vi.mock('@/lib/services/audit', () => ({
  getAuditLogsByEntity: vi.fn(),
  getAuditLogsByActor: vi.fn(),
  createAuditLog: vi.fn(),
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
import { GET as getAuditLogs } from '../auditLogs/route';
import { GET as getEntityAuditLogs } from '../audit/entity/[type]/[id]/route';
import { GET as getComplianceAudit } from '../compliance/audit/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { getAuditLogsByEntity, getAuditLogsByActor } from '@/lib/services/audit';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockGetAuditLogsByEntity = getAuditLogsByEntity as ReturnType<typeof vi.fn>;
const mockGetAuditLogsByActor = getAuditLogsByActor as ReturnType<typeof vi.fn>;

function createRequest(url: string): NextRequest {
  const req = new Request(`http://localhost${url}`) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function fakeSession(authUserId = 'auth-user-1') {
  return { user: { id: authUserId, email: 'admin@example.com' } };
}

const fakeAuditLogs = [
  {
    id: 'log-1',
    entityType: 'USER',
    entityId: 'user-uuid-1',
    action: 'ROLE_CHANGED',
    actorId: 'super-uuid-1',
    metadata: { from: 'STUDENT', to: 'SUPERINTENDENT' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'log-2',
    entityType: 'APPLICATION',
    entityId: 'app-uuid-1',
    action: 'STATUS_CHANGED',
    actorId: 'super-uuid-1',
    metadata: { from: 'DRAFT', to: 'SUBMITTED' },
    createdAt: new Date().toISOString(),
  },
];

/**
 * Set up db.select for the two-call Promise.all pattern used by auditLogs route:
 *   call 1 — data query:  .from().where().orderBy().limit().offset() → resolves list
 *   call 2 — count query: .from().where()                            → resolves [{total}]
 */
function setupAuditDbMock(data: unknown[], total: number) {
  const dbMock = db as unknown as { select: ReturnType<typeof vi.fn> };

  const dataChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(data),
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
// GET /api/auditLogs
// ---------------------------------------------------------------------------

describe('GET /api/auditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated audit logs for SUPERINTENDENT', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupAuditDbMock(fakeAuditLogs, 2);

    const req = createRequest('/api/auditLogs');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);
  });

  it('returns paginated audit logs for TRUSTEE', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    setupAuditDbMock(fakeAuditLogs, 2);

    const req = createRequest('/api/auditLogs');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  it('returns paginated audit logs for ACCOUNTS', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });
    setupAuditDbMock([fakeAuditLogs[0]], 1);

    const req = createRequest('/api/auditLogs');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it('supports entityType filter', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const userLogs = fakeAuditLogs.filter((l) => l.entityType === 'USER');
    setupAuditDbMock(userLogs, userLogs.length);

    const req = createRequest('/api/auditLogs?entityType=USER');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].entityType).toBe('USER');
  });

  it('supports actorId filter', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupAuditDbMock(fakeAuditLogs, 2);

    const req = createRequest('/api/auditLogs?actorId=super-uuid-1');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
  });

  it('supports custom pagination', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupAuditDbMock([], 200);

    const req = createRequest('/api/auditLogs?page=2&limit=25');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.limit).toBe(25);
  });

  it('defaults to page=1 and limit=50 when not provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupAuditDbMock([], 0);

    const req = createRequest('/api/auditLogs');
    const res = await getAuditLogs(req);

    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/auditLogs');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized."),
    );

    const req = createRequest('/api/auditLogs');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 500 on unexpected DB error', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const dbMock = db as unknown as { select: ReturnType<typeof vi.fn> };
    dbMock.select.mockImplementationOnce(() => {
      throw new Error('DB error');
    });

    const req = createRequest('/api/auditLogs');
    const res = await getAuditLogs(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// GET /api/audit/entity/[type]/[id]
// ---------------------------------------------------------------------------

describe('GET /api/audit/entity/[type]/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuditLogsByEntity.mockResolvedValue(fakeAuditLogs);
  });

  it('returns entity audit logs for valid type and id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/audit/entity/APPLICATION/app-uuid-1');
    const res = await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'APPLICATION', id: 'app-uuid-1' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
  });

  it('calls getAuditLogsByEntity with correct type, id, and default limit', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/audit/entity/USER/user-uuid-1');
    await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'USER', id: 'user-uuid-1' }),
    });

    expect(mockGetAuditLogsByEntity).toHaveBeenCalledWith('USER', 'user-uuid-1', 100);
  });

  it('passes custom limit parameter to getAuditLogsByEntity', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockGetAuditLogsByEntity.mockResolvedValue([fakeAuditLogs[0]]);

    const req = createRequest('/api/audit/entity/ROOM/room-uuid-1?limit=10');
    await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'ROOM', id: 'room-uuid-1' }),
    });

    expect(mockGetAuditLogsByEntity).toHaveBeenCalledWith('ROOM', 'room-uuid-1', 10);
  });

  it('returns empty data array when no logs exist for entity', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    mockGetAuditLogsByEntity.mockResolvedValue([]);

    const req = createRequest('/api/audit/entity/PAYMENT/payment-uuid-99');
    const res = await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'PAYMENT', id: 'payment-uuid-99' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/audit/entity/USER/some-id');
    const res = await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'USER', id: 'some-id' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized."),
    );

    const req = createRequest('/api/audit/entity/USER/some-id');
    const res = await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'USER', id: 'some-id' }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'PARENT' is not authorized."),
    );

    const req = createRequest('/api/audit/entity/USER/some-id');
    const res = await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'USER', id: 'some-id' }),
    });

    expect(res.status).toBe(403);
  });

  it('returns 500 when getAuditLogsByEntity throws an unexpected error', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockGetAuditLogsByEntity.mockRejectedValue(new Error('DB timeout'));

    const req = createRequest('/api/audit/entity/USER/some-id');
    const res = await getEntityAuditLogs(req, {
      params: Promise.resolve({ type: 'USER', id: 'some-id' }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.message).not.toContain('DB timeout');
  });
});

// ---------------------------------------------------------------------------
// GET /api/compliance/audit
// ---------------------------------------------------------------------------

describe('GET /api/compliance/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuditLogsByActor.mockResolvedValue(fakeAuditLogs);
    mockGetAuditLogsByEntity.mockResolvedValue([fakeAuditLogs[0]]);
  });

  it('returns audit logs filtered by actorId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/compliance/audit?actorId=super-uuid-1');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(mockGetAuditLogsByActor).toHaveBeenCalledWith('super-uuid-1', 100);
  });

  it('passes custom limit to getAuditLogsByActor', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/compliance/audit?actorId=super-uuid-1&limit=20');
    await getComplianceAudit(req);

    expect(mockGetAuditLogsByActor).toHaveBeenCalledWith('super-uuid-1', 20);
  });

  it('returns audit logs filtered by entityType + entityId', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createRequest('/api/compliance/audit?entityType=APPLICATION&entityId=app-uuid-1');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(mockGetAuditLogsByEntity).toHaveBeenCalledWith('APPLICATION', 'app-uuid-1', 100);
  });

  it('passes custom limit to getAuditLogsByEntity', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createRequest('/api/compliance/audit?entityType=PAYMENT&entityId=pay-1&limit=5');
    await getComplianceAudit(req);

    expect(mockGetAuditLogsByEntity).toHaveBeenCalledWith('PAYMENT', 'pay-1', 5);
  });

  it('prefers entityType+entityId over actorId when both are provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest(
      '/api/compliance/audit?entityType=APPLICATION&entityId=app-uuid-1&actorId=super-1',
    );
    await getComplianceAudit(req);

    expect(mockGetAuditLogsByEntity).toHaveBeenCalled();
    expect(mockGetAuditLogsByActor).not.toHaveBeenCalled();
  });

  it('returns 400 when neither actorId nor entityType+entityId is provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/compliance/audit');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toMatch(/actorId|entityType/i);
  });

  it('returns 400 when entityType is provided but entityId is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/compliance/audit?entityType=APPLICATION');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when entityId is provided but entityType is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/compliance/audit?entityId=app-uuid-1');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/compliance/audit?actorId=someone');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized."),
    );

    const req = createRequest('/api/compliance/audit?actorId=someone');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'PARENT' is not authorized."),
    );

    const req = createRequest('/api/compliance/audit?actorId=someone');
    const res = await getComplianceAudit(req);

    expect(res.status).toBe(403);
  });

  it('uses default limit of 100 when limit param is absent', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/compliance/audit?actorId=super-uuid-1');
    await getComplianceAudit(req);

    expect(mockGetAuditLogsByActor).toHaveBeenCalledWith('super-uuid-1', 100);
  });
});
