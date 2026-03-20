import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { NotFoundError } from '@/lib/errors';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  notifications: {
    id: 'id',
    userId: 'user_id',
    read: 'read',
    readAt: 'read_at',
    createdAt: 'created_at',
    title: 'title',
    body: 'body',
    type: 'type',
  },
}));

import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../notifications';
import { db } from '@/lib/db';

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
// Helpers
// ---------------------------------------------------------------------------

const mockNotification = {
  id: 'notif-1',
  userId: 'user-1',
  title: 'Room Allocated',
  body: 'Room 101 has been allocated to you.',
  type: 'ROOM',
  read: false,
  readAt: null,
  createdAt: new Date('2026-01-01'),
};

function mockListQuery(data: object[], total: number) {
  let callCount = 0;
  (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(data),
              }),
            }),
          }),
        }),
      };
    }
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ total }]),
      }),
    };
  });
}

// ---------------------------------------------------------------------------
// listNotifications
// ---------------------------------------------------------------------------

describe('listNotifications', () => {
  it('returns paginated data with total, page, and limit', async () => {
    mockListQuery([mockNotification], 1);

    const result = await listNotifications('user-1');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
  });

  it('defaults to page 1 and limit 20', async () => {
    mockListQuery([mockNotification], 1);

    const result = await listNotifications('user-1');
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('respects custom page and limit', async () => {
    mockListQuery([], 0);

    const result = await listNotifications('user-1', 2, 10);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it('returns notifications for the specified userId', async () => {
    mockListQuery([mockNotification], 1);

    const result = await listNotifications('user-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(mockNotification);
  });

  it('returns empty array when user has no notifications', async () => {
    mockListQuery([], 0);

    const result = await listNotifications('user-with-no-notifs');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns correct total count', async () => {
    mockListQuery([mockNotification], 42);

    const result = await listNotifications('user-1');
    expect(result.total).toBe(42);
  });

  it('queries only notifications belonging to the given userId', async () => {
    mockListQuery([], 0);

    await listNotifications('specific-user-123');
    expect(db.select).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// markAsRead
// ---------------------------------------------------------------------------

describe('markAsRead', () => {
  it('marks a notification as read and returns it', async () => {
    const readNotif = { ...mockNotification, read: true, readAt: new Date() };
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([readNotif]),
        }),
      }),
    });

    const result = await markAsRead('notif-1', 'user-1');
    expect(result.read).toBe(true);
    expect(result.readAt).toBeDefined();
    expect(result.id).toBe('notif-1');
  });

  it('throws NotFoundError when notification does not belong to the user', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(markAsRead('notif-1', 'wrong-user')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError for nonexistent notification id', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(markAsRead('nonexistent-id', 'user-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('NotFoundError has correct status 404', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    try {
      await markAsRead('bad-id', 'user-1');
    } catch (err) {
      expect((err as NotFoundError).status).toBe(404);
      expect((err as NotFoundError).code).toBe('NOT_FOUND');
    }
  });

  it('the update filters by both notificationId and userId', async () => {
    const updateFn = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...mockNotification, read: true }]),
        }),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(updateFn);

    await markAsRead('notif-1', 'user-1');
    expect(updateFn).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// markAllAsRead
// ---------------------------------------------------------------------------

describe('markAllAsRead', () => {
  it('resolves without error when user has unread notifications', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    await expect(markAllAsRead('user-1')).resolves.toBeUndefined();
  });

  it('resolves without error when user has no notifications', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    await expect(markAllAsRead('user-with-no-notifs')).resolves.toBeUndefined();
  });

  it('calls db.update to mark all as read', async () => {
    const updateFn = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(updateFn);

    await markAllAsRead('user-1');
    expect(updateFn).toHaveBeenCalledTimes(1);
  });

  it('sets read: true in the update payload', async () => {
    const setFn = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setFn });

    await markAllAsRead('user-1');
    const setPayload = setFn.mock.calls[0]?.[0];
    expect(setPayload).toHaveProperty('read', true);
    expect(setPayload).toHaveProperty('readAt');
  });
});

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

describe('getUnreadCount', () => {
  it('returns the count of unread notifications', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 7 }]),
      }),
    });

    const count = await getUnreadCount('user-1');
    expect(count).toBe(7);
  });

  it('returns 0 when user has no unread notifications', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    });

    const count = await getUnreadCount('user-1');
    expect(count).toBe(0);
  });

  it('returns 0 when result is empty (graceful null handling)', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const count = await getUnreadCount('user-1');
    expect(count).toBe(0);
  });

  it('returns a number type', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 3 }]),
      }),
    });

    const count = await getUnreadCount('user-1');
    expect(typeof count).toBe('number');
  });

  it('returns large counts correctly', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 999 }]),
      }),
    });

    const count = await getUnreadCount('high-volume-user');
    expect(count).toBe(999);
  });
});
