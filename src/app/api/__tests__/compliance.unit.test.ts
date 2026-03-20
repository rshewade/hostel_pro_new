/**
 * Unit tests for compliance routes
 *
 * Covers:
 *   GET  /api/compliance/consents          — list consents for authenticated user
 *   POST /api/compliance/consents          — create consent log (captures IP + user-agent)
 *   POST /api/admin/cron/data-retention    — run data retention (validates x-cron-secret header)
 *
 * Auth, consent service, and data-retention service are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

const {
  mockRequireAuth,
  mockGetConsentsByUser,
  mockCreateConsentLog,
  mockRunDataRetention,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGetConsentsByUser: vi.fn(),
  mockCreateConsentLog: vi.fn(),
  mockRunDataRetention: vi.fn(),
}));

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/services/consent', () => ({
  getConsentsByUser: mockGetConsentsByUser,
  createConsentLog: mockCreateConsentLog,
}));

vi.mock('@/lib/services/data-retention', () => ({
  runDataRetention: mockRunDataRetention,
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

import { GET as consentsGet, POST as consentsPost } from '../compliance/consents/route';
import { POST as cronPost } from '../admin/cron/data-retention/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSession(userId = 'auth-user-1') {
  return { user: { id: userId } };
}

function createGetRequest(url: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`));
}

function createPostRequest(
  url: string,
  body: unknown = {},
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const fakeConsents = [
  {
    id: 'consent-1',
    userId: 'auth-user-1',
    consentType: 'PRIVACY_POLICY',
    consentVersion: '1.0',
    consentGiven: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'consent-2',
    userId: 'auth-user-1',
    consentType: 'TERMS_OF_SERVICE',
    consentVersion: '2.1',
    consentGiven: true,
    createdAt: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// GET /api/compliance/consents
// ---------------------------------------------------------------------------

describe('GET /api/compliance/consents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the consent list for the authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('auth-user-1'));
    mockGetConsentsByUser.mockResolvedValue(fakeConsents);

    const req = createGetRequest('/api/compliance/consents');
    const res = await consentsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].consentType).toBe('PRIVACY_POLICY');
  });

  it('calls getConsentsByUser with the session userId', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('specific-user'));
    mockGetConsentsByUser.mockResolvedValue([]);

    const req = createGetRequest('/api/compliance/consents');
    await consentsGet(req);

    expect(mockGetConsentsByUser).toHaveBeenCalledWith('specific-user');
  });

  it('returns empty array when user has no consents', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockGetConsentsByUser.mockResolvedValue([]);

    const req = createGetRequest('/api/compliance/consents');
    const res = await consentsGet(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createGetRequest('/api/compliance/consents');
    const res = await consentsGet(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 500 when service throws unexpectedly', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockGetConsentsByUser.mockRejectedValue(new Error('DB timeout'));

    const req = createGetRequest('/api/compliance/consents');
    const res = await consentsGet(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('DB timeout');
  });
});

// ---------------------------------------------------------------------------
// POST /api/compliance/consents
// ---------------------------------------------------------------------------

describe('POST /api/compliance/consents', () => {
  const validBody = {
    consentType: 'PRIVACY_POLICY',
    consentVersion: '1.0',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a consent log and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('user-abc'));
    const created = { id: 'consent-new', userId: 'user-abc', ...validBody };
    mockCreateConsentLog.mockResolvedValue(created);

    const req = createPostRequest('/api/compliance/consents', validBody);
    const res = await consentsPost(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('consent-new');
    expect(body.consentType).toBe('PRIVACY_POLICY');
  });

  it('passes userId from session to createConsentLog', async () => {
    mockRequireAuth.mockResolvedValue(mockSession('session-user-id'));
    mockCreateConsentLog.mockResolvedValue({ id: 'c-1' });

    const req = createPostRequest('/api/compliance/consents', validBody);
    await consentsPost(req);

    expect(mockCreateConsentLog).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'session-user-id' }),
    );
  });

  it('captures x-forwarded-for header as ipAddress', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockCreateConsentLog.mockResolvedValue({ id: 'c-1' });

    const req = createPostRequest(
      '/api/compliance/consents',
      validBody,
      { 'x-forwarded-for': '203.0.113.42' },
    );
    await consentsPost(req);

    expect(mockCreateConsentLog).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: '203.0.113.42' }),
    );
  });

  it('captures user-agent header', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockCreateConsentLog.mockResolvedValue({ id: 'c-1' });

    const req = createPostRequest(
      '/api/compliance/consents',
      validBody,
      { 'user-agent': 'Mozilla/5.0 (TestBrowser)' },
    );
    await consentsPost(req);

    expect(mockCreateConsentLog).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: 'Mozilla/5.0 (TestBrowser)' }),
    );
  });

  it('accepts optional digitalSignature field', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());
    mockCreateConsentLog.mockResolvedValue({ id: 'c-1' });

    const req = createPostRequest('/api/compliance/consents', {
      ...validBody,
      digitalSignature: 'SHA256:abc123',
    });
    const res = await consentsPost(req);

    expect(res.status).toBe(201);
    expect(mockCreateConsentLog).toHaveBeenCalledWith(
      expect.objectContaining({ digitalSignature: 'SHA256:abc123' }),
    );
  });

  it('returns 400 when consentType is empty', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    const req = createPostRequest('/api/compliance/consents', {
      consentType: '',
      consentVersion: '1.0',
    });
    const res = await consentsPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when consentVersion is empty', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    const req = createPostRequest('/api/compliance/consents', {
      consentType: 'PRIVACY_POLICY',
      consentVersion: '',
    });
    const res = await consentsPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when required fields are missing', async () => {
    mockRequireAuth.mockResolvedValue(mockSession());

    const req = createPostRequest('/api/compliance/consents', {});
    const res = await consentsPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Authentication required'));

    const req = createPostRequest('/api/compliance/consents', validBody);
    const res = await consentsPost(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/cron/data-retention
// ---------------------------------------------------------------------------

describe('POST /api/admin/cron/data-retention', () => {
  const VALID_SECRET = 'my-super-secret-cron-key';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = VALID_SECRET;
  });

  it('runs data retention when x-cron-secret is valid', async () => {
    const retentionResult = { deleted: { auditLogs: 120, notifications: 300 } };
    mockRunDataRetention.mockResolvedValue(retentionResult);

    const req = createPostRequest(
      '/api/admin/cron/data-retention',
      {},
      { 'x-cron-secret': VALID_SECRET },
    );
    const res = await cronPost(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(retentionResult);
    expect(mockRunDataRetention).toHaveBeenCalledOnce();
  });

  it('returns 401 when x-cron-secret header is missing', async () => {
    const req = createPostRequest('/api/admin/cron/data-retention', {});
    const res = await cronPost(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(mockRunDataRetention).not.toHaveBeenCalled();
  });

  it('returns 401 when x-cron-secret is wrong', async () => {
    const req = createPostRequest(
      '/api/admin/cron/data-retention',
      {},
      { 'x-cron-secret': 'wrong-secret' },
    );
    const res = await cronPost(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(mockRunDataRetention).not.toHaveBeenCalled();
  });

  it('returns 401 when x-cron-secret is an empty string', async () => {
    const req = createPostRequest(
      '/api/admin/cron/data-retention',
      {},
      { 'x-cron-secret': '' },
    );
    const res = await cronPost(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(mockRunDataRetention).not.toHaveBeenCalled();
  });

  it('returns 500 when runDataRetention throws unexpectedly', async () => {
    mockRunDataRetention.mockRejectedValue(new Error('DB vacuum failed'));

    const req = createPostRequest(
      '/api/admin/cron/data-retention',
      {},
      { 'x-cron-secret': VALID_SECRET },
    );
    const res = await cronPost(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('vacuum');
  });
});
