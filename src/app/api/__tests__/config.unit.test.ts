/**
 * Unit tests for configuration API routes:
 *   GET  /api/config/blackout-dates          — list active blackout dates (no auth)
 *   POST /api/config/blackout-dates          — create a blackout date (staff only)
 *   GET  /api/config/leave-types             — list all leave types (no auth)
 *   POST /api/config/leave-types             — create a leave type (staff only)
 *   GET  /api/config/notification-rules      — list all notification rules (no auth)
 *   POST /api/config/notification-rules      — create a notification rule (staff only)
 *   PUT  /api/config/notification-rules      — update a notification rule (staff only)
 *   DELETE /api/config/notification-rules    — delete a notification rule (staff only)
 *
 * All DB operations are mocked — no real DB connection is made.
 * Note: notification-rules PUT uses updateRuleSchema which requires a valid UUID for id.
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
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  blackoutDates: {
    isActive: 'is_active',
    startDate: 'start_date',
  },
  leaveTypes: {
    name: 'name',
  },
  notificationRules: {
    eventType: 'event_type',
    id: 'id',
    updatedAt: 'updated_at',
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
import {
  GET as getBlackoutDates,
  POST as createBlackoutDate,
} from '../config/blackout-dates/route';
import {
  GET as getLeaveTypes,
  POST as createLeaveType,
} from '../config/leave-types/route';
import {
  GET as getNotificationRules,
  POST as createNotificationRule,
  PUT as updateNotificationRule,
  DELETE as deleteNotificationRule,
} from '../config/notification-rules/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Valid UUID to use in tests where UUID validation applies (e.g. notification-rules PUT)
const VALID_RULE_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const NONEXISTENT_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

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

function fakeSession(authUserId = 'auth-super-1') {
  return { user: { id: authUserId, email: 'super@example.com' } };
}

// Drizzle select chain that resolves with a given list via .orderBy()
function buildSelectChain(data: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(data),
  };
}

// Drizzle insert chain: insert().values().returning()
function buildInsertChain(returning: unknown[]) {
  return {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
}

// Drizzle update chain: update().set().where().returning()
function buildUpdateChain(returning: unknown[]) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
}

// Drizzle delete chain: delete().where().returning()
function buildDeleteChain(returning: unknown[]) {
  return {
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeBlackoutDate = {
  id: 'bd-uuid-1',
  startDate: '2026-12-25',
  endDate: '2026-12-31',
  reason: 'Winter break',
  vertical: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeLeaveType = {
  id: 'lt-uuid-1',
  name: 'Medical Leave',
  description: 'Leave for medical reasons',
  maxDays: '7',
  requiresApproval: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeNotificationRule = {
  id: VALID_RULE_UUID,
  eventType: 'FEE_DUE',
  timing: 'IMMEDIATE',
  channels: { sms: true, email: true, whatsapp: false },
  verticals: ['BOYS', 'GIRLS'],
  template: 'Your fee of {{amount}} is due on {{dueDate}}.',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// GET /api/config/blackout-dates
// ---------------------------------------------------------------------------

describe('GET /api/config/blackout-dates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(buildSelectChain([fakeBlackoutDate]));
  });

  it('returns active blackout dates without requiring authentication', async () => {
    const res = await getBlackoutDates();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].reason).toBe('Winter break');
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('returns empty list when no active blackout dates exist', async () => {
    mockDb.select.mockReturnValue(buildSelectChain([]));

    const res = await getBlackoutDates();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 500 on DB error', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('DB connection lost');
    });

    const res = await getBlackoutDates();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('DB connection lost');
  });
});

// ---------------------------------------------------------------------------
// POST /api/config/blackout-dates
// ---------------------------------------------------------------------------

describe('POST /api/config/blackout-dates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue(buildInsertChain([fakeBlackoutDate]));
  });

  it('creates a blackout date with valid data and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      startDate: '2026-12-25',
      endDate: '2026-12-31',
      reason: 'Winter break',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.reason).toBe('Winter break');
    expect(body.isActive).toBe(true);
  });

  it('creates a blackout date with optional vertical field', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    const withVertical = { ...fakeBlackoutDate, vertical: 'BOYS' };
    mockDb.insert.mockReturnValue(buildInsertChain([withVertical]));

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      startDate: '2026-12-25',
      endDate: '2026-12-31',
      reason: 'Boys hostel closed',
      vertical: 'BOYS',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.vertical).toBe('BOYS');
  });

  it('returns 400 for missing reason', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      startDate: '2026-12-25',
      endDate: '2026-12-31',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing startDate', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      endDate: '2026-12-31',
      reason: 'Holiday',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing endDate', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      startDate: '2026-12-25',
      reason: 'Holiday',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid vertical enum value', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      startDate: '2026-12-25',
      endDate: '2026-12-31',
      reason: 'Holiday',
      vertical: 'INVALID_VERTICAL',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      startDate: '2026-12-25',
      endDate: '2026-12-31',
      reason: 'Holiday',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(
      new ForbiddenError("Role 'STUDENT' is not authorized."),
    );

    const req = createJsonRequest('/api/config/blackout-dates', 'POST', {
      startDate: '2026-12-25',
      endDate: '2026-12-31',
      reason: 'Holiday',
    });
    const res = await createBlackoutDate(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// GET /api/config/leave-types
// ---------------------------------------------------------------------------

describe('GET /api/config/leave-types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(buildSelectChain([fakeLeaveType]));
  });

  it('returns all leave types without requiring authentication', async () => {
    const res = await getLeaveTypes();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Medical Leave');
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('returns empty list when no leave types are configured', async () => {
    mockDb.select.mockReturnValue(buildSelectChain([]));

    const res = await getLeaveTypes();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 500 on DB error', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('Query failed');
    });

    const res = await getLeaveTypes();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/config/leave-types
// ---------------------------------------------------------------------------

describe('POST /api/config/leave-types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue(buildInsertChain([fakeLeaveType]));
  });

  it('creates a leave type with valid data and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/leave-types', 'POST', {
      name: 'Medical Leave',
      description: 'Leave for medical reasons',
      maxDays: '7',
      requiresApproval: true,
    });
    const res = await createLeaveType(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Medical Leave');
  });

  it('creates a leave type with minimal fields (name only)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });
    const minimalType = { ...fakeLeaveType, description: null, maxDays: null };
    mockDb.insert.mockReturnValue(buildInsertChain([minimalType]));

    const req = createJsonRequest('/api/config/leave-types', 'POST', {
      name: 'Emergency Leave',
    });
    const res = await createLeaveType(req);

    expect(res.status).toBe(201);
  });

  it('returns 400 for missing name', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/leave-types', 'POST', {
      description: 'Some leave',
      requiresApproval: true,
    });
    const res = await createLeaveType(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for empty string name', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/leave-types', 'POST', {
      name: '',
    });
    const res = await createLeaveType(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/config/leave-types', 'POST', { name: 'Casual' });
    const res = await createLeaveType(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/config/leave-types', 'POST', { name: 'Casual' });
    const res = await createLeaveType(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'ACCOUNTS' is not authorized."));

    const req = createJsonRequest('/api/config/leave-types', 'POST', { name: 'Casual' });
    const res = await createLeaveType(req);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/config/notification-rules
// ---------------------------------------------------------------------------

describe('GET /api/config/notification-rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(buildSelectChain([fakeNotificationRule]));
  });

  it('returns all notification rules without requiring authentication', async () => {
    const res = await getNotificationRules();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].eventType).toBe('FEE_DUE');
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });

  it('returns empty list when no rules are configured', async () => {
    mockDb.select.mockReturnValue(buildSelectChain([]));

    const res = await getNotificationRules();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 500 on DB error', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('DB gone');
    });

    const res = await getNotificationRules();

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/config/notification-rules
// ---------------------------------------------------------------------------

describe('POST /api/config/notification-rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnValue(buildInsertChain([fakeNotificationRule]));
  });

  it('creates a notification rule with valid data and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      eventType: 'FEE_DUE',
      template: 'Your fee of {{amount}} is due.',
      channels: { sms: true, email: true },
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.eventType).toBe('FEE_DUE');
  });

  it('creates a notification rule with TRUSTEE role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      eventType: 'APPLICATION_APPROVED',
      template: 'Your application has been approved.',
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(201);
  });

  it('returns 400 for missing eventType', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      template: 'Some notification template.',
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing template', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      eventType: 'FEE_DUE',
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for empty string eventType', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      eventType: '',
      template: 'A template.',
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 for empty string template', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      eventType: 'FEE_DUE',
      template: '',
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      eventType: 'FEE_DUE',
      template: 'A template.',
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(401);
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/config/notification-rules', 'POST', {
      eventType: 'FEE_DUE',
      template: 'A template.',
    });
    const res = await createNotificationRule(req);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/config/notification-rules
// ---------------------------------------------------------------------------

describe('PUT /api/config/notification-rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnValue(buildUpdateChain([fakeNotificationRule]));
  });

  it('updates a notification rule and returns 200', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'PUT', {
      id: VALID_RULE_UUID,
      template: 'Updated template {{amount}}.',
    });
    const res = await updateNotificationRule(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(VALID_RULE_UUID);
  });

  it('updates isActive to false (deactivate rule)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    const deactivated = { ...fakeNotificationRule, isActive: false };
    mockDb.update.mockReturnValue(buildUpdateChain([deactivated]));

    const req = createJsonRequest('/api/config/notification-rules', 'PUT', {
      id: VALID_RULE_UUID,
      isActive: false,
    });
    const res = await updateNotificationRule(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isActive).toBe(false);
  });

  it('returns 404 when the rule does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockDb.update.mockReturnValue(buildUpdateChain([]));

    const req = createJsonRequest('/api/config/notification-rules', 'PUT', {
      id: NONEXISTENT_UUID,
      template: 'Updated.',
    });
    const res = await updateNotificationRule(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 when id is not a valid UUID', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'PUT', {
      id: 'not-a-uuid',
      template: 'Updated.',
    });
    const res = await updateNotificationRule(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when id is missing entirely', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createJsonRequest('/api/config/notification-rules', 'PUT', {
      template: 'Updated.',
    });
    const res = await updateNotificationRule(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/config/notification-rules', 'PUT', {
      id: VALID_RULE_UUID,
    });
    const res = await updateNotificationRule(req);

    expect(res.status).toBe(401);
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/config/notification-rules', 'PUT', {
      id: VALID_RULE_UUID,
    });
    const res = await updateNotificationRule(req);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/config/notification-rules
// ---------------------------------------------------------------------------

describe('DELETE /api/config/notification-rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.delete.mockReturnValue(buildDeleteChain([fakeNotificationRule]));
  });

  it('deletes a notification rule and returns 200', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest(`/api/config/notification-rules?id=${VALID_RULE_UUID}`, { method: 'DELETE' });
    const res = await deleteNotificationRule(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 400 when id query parameter is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/config/notification-rules', { method: 'DELETE' });
    const res = await deleteNotificationRule(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('id');
  });

  it('returns 404 when the rule does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockDb.delete.mockReturnValue(buildDeleteChain([]));

    const req = createRequest(`/api/config/notification-rules?id=${NONEXISTENT_UUID}`, { method: 'DELETE' });
    const res = await deleteNotificationRule(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest(`/api/config/notification-rules?id=${VALID_RULE_UUID}`, { method: 'DELETE' });
    const res = await deleteNotificationRule(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createRequest(`/api/config/notification-rules?id=${VALID_RULE_UUID}`, { method: 'DELETE' });
    const res = await deleteNotificationRule(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'ACCOUNTS' is not authorized."));

    const req = createRequest(`/api/config/notification-rules?id=${VALID_RULE_UUID}`, { method: 'DELETE' });
    const res = await deleteNotificationRule(req);

    expect(res.status).toBe(403);
  });

  it('returns 500 on unexpected DB error during deletion', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });
    mockDb.delete.mockImplementationOnce(() => {
      throw new Error('Constraint violation');
    });

    const req = createRequest(`/api/config/notification-rules?id=${VALID_RULE_UUID}`, { method: 'DELETE' });
    const res = await deleteNotificationRule(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.message).not.toContain('Constraint violation');
  });
});
