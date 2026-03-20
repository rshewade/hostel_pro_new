/**
 * Unit tests for GET /api/communications
 *
 * The communications route queries the DB directly (no service layer).
 * We mock @/lib/db to control query results and isolate the handler logic.
 * The route uses Promise.all([data, count]) so db.select is called twice
 * per request: first for paginated rows, then for total count.
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
  communications: {
    type: 'type',
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

// Import route handler AFTER mocks
import { GET } from '../communications/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;

function createRequest(url: string): NextRequest {
  const req = new Request(`http://localhost${url}`) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function fakeSession(authUserId = 'auth-user-1') {
  return { user: { id: authUserId, email: 'user@example.com' } };
}

const fakeCommunications = [
  {
    id: 'comm-1',
    type: 'SMS',
    status: 'SENT',
    recipientPhone: '+919876543210',
    message: 'Your OTP is 123456',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'comm-2',
    type: 'EMAIL',
    status: 'DELIVERED',
    recipientEmail: 'student@example.com',
    message: 'Your fee is due',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Set up db.select for the two-call Promise.all pattern:
 *   call 1 — data query:  .from().where().orderBy().limit().offset() → resolves list
 *   call 2 — count query: .from().where()                            → resolves [{total}]
 */
function setupDbMock(data: unknown[], total: number) {
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

describe('GET /api/communications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns paginated communications for SUPERINTENDENT', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock(fakeCommunications, 2);

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);
  });

  it('returns paginated communications for TRUSTEE', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    setupDbMock(fakeCommunications, 2);

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  it('returns paginated communications for ACCOUNTS', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });
    setupDbMock([fakeCommunications[0]], 1);

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('supports type filter SMS', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const smsComs = fakeCommunications.filter((c) => c.type === 'SMS');
    setupDbMock(smsComs, smsComs.length);

    const req = createRequest('/api/communications?type=SMS');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((c: { type: string }) => c.type === 'SMS')).toBe(true);
  });

  it('supports type filter EMAIL', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const emailComs = fakeCommunications.filter((c) => c.type === 'EMAIL');
    setupDbMock(emailComs, emailComs.length);

    const req = createRequest('/api/communications?type=EMAIL');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('supports type filter WHATSAPP', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 0);

    const req = createRequest('/api/communications?type=WHATSAPP');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it('supports type filter PUSH', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 0);

    const req = createRequest('/api/communications?type=PUSH');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('supports status filter PENDING', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 0);

    const req = createRequest('/api/communications?status=PENDING');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it('supports status filter SENT', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const sentComs = fakeCommunications.filter((c) => c.status === 'SENT');
    setupDbMock(sentComs, sentComs.length);

    const req = createRequest('/api/communications?status=SENT');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((c: { status: string }) => c.status === 'SENT')).toBe(true);
  });

  it('supports status filter DELIVERED', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const deliveredComs = fakeCommunications.filter((c) => c.status === 'DELIVERED');
    setupDbMock(deliveredComs, deliveredComs.length);

    const req = createRequest('/api/communications?status=DELIVERED');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it('supports status filter FAILED', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 0);

    const req = createRequest('/api/communications?status=FAILED');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('supports status filter BOUNCED', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 0);

    const req = createRequest('/api/communications?status=BOUNCED');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('supports combined type+status filters', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const filtered = fakeCommunications.filter((c) => c.type === 'SMS' && c.status === 'SENT');
    setupDbMock(filtered, filtered.length);

    const req = createRequest('/api/communications?type=SMS&status=SENT');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(filtered.length);
  });

  it('supports custom pagination page and limit', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 100);

    const req = createRequest('/api/communications?page=3&limit=10');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(3);
    expect(body.limit).toBe(10);
  });

  it('defaults to page=1 and limit=50 when not provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 0);

    const req = createRequest('/api/communications');
    const res = await GET(req);

    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);
  });

  it('returns empty data array when no communications match', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    setupDbMock([], 0);

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized. Required: SUPERINTENDENT, TRUSTEE, ACCOUNTS"),
    );

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'PARENT' is not authorized. Required: SUPERINTENDENT, TRUSTEE, ACCOUNTS"),
    );

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 500 when DB query throws an unexpected error', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const dbMock = db as unknown as { select: ReturnType<typeof vi.fn> };
    dbMock.select.mockImplementationOnce(() => {
      throw new Error('Connection pool exhausted');
    });

    const req = createRequest('/api/communications');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('Connection pool');
  });
});
