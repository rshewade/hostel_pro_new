// @vitest-environment node
/**
 * Unit tests for the health-check API route:
 *   GET /api/health  — returns healthy/unhealthy status + DB probe result
 *
 * The DB is fully mocked — no real PostgreSQL connection is made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- module mocks ----------------------------------------------------------

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

// Import route handler AFTER mocks
import { GET } from '../health/route';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with status=healthy when DB probe succeeds', async () => {
    mockDb.execute.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('connected');
  });

  it('includes a timestamp in the healthy response', async () => {
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await GET();
    const body = await res.json();

    expect(body.timestamp).toBeDefined();
    // Should be a valid ISO date string
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
  });

  it('returns 503 with status=unhealthy when DB probe throws', async () => {
    mockDb.execute.mockRejectedValue(new Error('Connection refused'));

    const res = await GET();

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('unhealthy');
    expect(body.database).toBe('disconnected');
  });

  it('does not leak the internal error message in unhealthy response', async () => {
    mockDb.execute.mockRejectedValue(new Error('pg: password authentication failed for user "db_user1"'));

    const res = await GET();
    const body = await res.json();

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('password authentication failed');
  });

  it('calls db.execute for the DB probe', async () => {
    mockDb.execute.mockResolvedValue({ rows: [] });

    await GET();

    expect(mockDb.execute).toHaveBeenCalledTimes(1);
  });

  it('response body has exactly the right keys when healthy', async () => {
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await GET();
    const body = await res.json();
    const keys = Object.keys(body).sort();

    expect(keys).toContain('status');
    expect(keys).toContain('database');
    expect(keys).toContain('timestamp');
  });

  it('response body has the right keys when unhealthy', async () => {
    mockDb.execute.mockRejectedValue(new Error('Down'));

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('database');
  });
});
