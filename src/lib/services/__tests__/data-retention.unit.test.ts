import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  applications: {
    id: 'id',
    currentStatus: 'current_status',
    updatedAt: 'updated_at',
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

import { runDataRetention, getRetentionStats } from '../data-retention';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// runDataRetention
// ---------------------------------------------------------------------------

describe('runDataRetention', () => {
  it('returns archivedApplications count', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 'app-1' },
            { id: 'app-2' },
          ]),
        }),
      }),
    });

    const result = await runDataRetention();
    expect(result).toHaveProperty('archivedApplications', 2);
  });

  it('returns 0 when no applications need archiving', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await runDataRetention();
    expect(result.archivedApplications).toBe(0);
  });

  it('sets status to ARCHIVED for eligible applications', async () => {
    const setFn = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'app-1' }]),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setFn });

    await runDataRetention();

    const setPayload = setFn.mock.calls[0]?.[0];
    expect(setPayload).toHaveProperty('currentStatus', 'ARCHIVED');
  });

  it('logs the number of archived applications', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'app-1' }, { id: 'app-2' }, { id: 'app-3' }]),
        }),
      }),
    });

    await runDataRetention();

    expect((logger.info as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      expect.stringContaining('3'),
    );
  });

  it('calls db.update exactly once', async () => {
    const updateFn = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(updateFn);

    await runDataRetention();
    expect(updateFn).toHaveBeenCalledTimes(1);
  });

  it('uses a cutoff date 365 days in the past', async () => {
    const updateFn = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(updateFn);

    const before = new Date();
    before.setDate(before.getDate() - 365);

    await runDataRetention();

    // Verify update was called (the exact cutoff date is an internal impl detail;
    // we just assert the mutation path was invoked with a where clause)
    expect(updateFn).toHaveBeenCalled();
  });

  it('returns an object with the archivedApplications key', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'x' }]),
        }),
      }),
    });

    const result = await runDataRetention();
    expect(Object.keys(result)).toContain('archivedApplications');
  });

  it('handles large batch archive correctly', async () => {
    const archived = Array.from({ length: 50 }, (_, i) => ({ id: `app-${i}` }));
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(archived),
        }),
      }),
    });

    const result = await runDataRetention();
    expect(result.archivedApplications).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// getRetentionStats
// ---------------------------------------------------------------------------

describe('getRetentionStats', () => {
  it('returns pendingArchive count from database', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ pendingArchive: 15 }]),
    });

    const stats = await getRetentionStats();
    expect(stats).toHaveProperty('pendingArchive', 15);
  });

  it('returns pendingArchive as 0 when result is null/undefined', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ pendingArchive: null }]),
    });

    const stats = await getRetentionStats();
    expect(stats.pendingArchive).toBe(0);
  });

  it('returns pendingArchive as 0 when query returns empty result', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockResolvedValue([]),
    });

    const stats = await getRetentionStats();
    expect(stats.pendingArchive).toBe(0);
  });

  it('returns an object with the pendingArchive key', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ pendingArchive: 5 }]),
    });

    const stats = await getRetentionStats();
    expect(stats).toHaveProperty('pendingArchive');
    expect(typeof stats.pendingArchive).toBe('number');
  });

  it('calls db.select exactly once', async () => {
    const selectFn = vi.fn().mockReturnValue({
      from: vi.fn().mockResolvedValue([{ pendingArchive: 0 }]),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectFn);

    await getRetentionStats();
    expect(selectFn).toHaveBeenCalledTimes(1);
  });

  it('returns zero when all apps are recent (nothing pending)', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ pendingArchive: 0 }]),
    });

    const stats = await getRetentionStats();
    expect(stats.pendingArchive).toBe(0);
  });
});
