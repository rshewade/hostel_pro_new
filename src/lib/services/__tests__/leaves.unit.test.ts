import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { ValidationError } from '@/lib/errors';

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'leave-1', status: 'PENDING' }]),
      }),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  leaveRequests: {
    id: 'id',
    studentUserId: 'student_user_id',
    status: 'status',
    createdAt: 'created_at',
    startTime: 'start_time',
    endTime: 'end_time',
  },
}));

import { createLeaveRequest } from '../leaves';
import { db } from '@/lib/db';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

beforeEach(() => {
  vi.restoreAllMocks();
});

function makeLeaveData(overrides: Partial<{
  startTime: Date;
  endTime: Date;
  studentUserId: string;
  reason: string;
}> = {}) {
  return {
    studentUserId: overrides.studentUserId ?? 'student-1',
    reason: overrides.reason ?? 'Going home',
    startTime: overrides.startTime ?? new Date(Date.now() + 86400000), // tomorrow
    endTime: overrides.endTime ?? new Date(Date.now() + 172800000), // day after tomorrow
    destination: 'Home',
    emergencyContact: '+919876543210',
    type: 'HOME_VISIT' as const,
  };
}

describe('createLeaveRequest - date validation', () => {
  it('throws ValidationError when start time is in the past', async () => {
    const pastDate = new Date(Date.now() - 86400000); // yesterday

    await expect(
      createLeaveRequest(makeLeaveData({
        startTime: pastDate,
        endTime: new Date(Date.now() + 86400000),
      })),
    ).rejects.toThrow(ValidationError);

    await expect(
      createLeaveRequest(makeLeaveData({
        startTime: pastDate,
        endTime: new Date(Date.now() + 86400000),
      })),
    ).rejects.toThrow('Start time must be in the future');
  });

  it('throws ValidationError when end time equals start time', async () => {
    const futureDate = new Date(Date.now() + 86400000);

    await expect(
      createLeaveRequest(makeLeaveData({
        startTime: futureDate,
        endTime: futureDate,
      })),
    ).rejects.toThrow(ValidationError);

    await expect(
      createLeaveRequest(makeLeaveData({
        startTime: futureDate,
        endTime: futureDate,
      })),
    ).rejects.toThrow('End time must be after start time');
  });

  it('throws ValidationError when end time is before start time', async () => {
    const futureDate = new Date(Date.now() + 172800000);
    const earlierFutureDate = new Date(Date.now() + 86400000);

    await expect(
      createLeaveRequest(makeLeaveData({
        startTime: futureDate,
        endTime: earlierFutureDate,
      })),
    ).rejects.toThrow(ValidationError);

    await expect(
      createLeaveRequest(makeLeaveData({
        startTime: futureDate,
        endTime: earlierFutureDate,
      })),
    ).rejects.toThrow('End time must be after start time');
  });

  it('accepts valid future start time with later end time', async () => {
    // Re-mock for successful case: no overlapping leaves, insert succeeds
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]), // no overlapping
      }),
    });
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'leave-new',
          status: 'PENDING',
          studentUserId: 'student-1',
        }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(mockInsert);

    const result = await createLeaveRequest(makeLeaveData());
    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');
  });

  it('thrown errors are instanceof ValidationError with status 400', async () => {
    const pastDate = new Date(Date.now() - 86400000);

    try {
      await createLeaveRequest(makeLeaveData({
        startTime: pastDate,
      }));
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).status).toBe(400);
      expect((err as ValidationError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('validates start time before checking end time', async () => {
    // Both are invalid: start in past, end before start
    const pastDate = new Date(Date.now() - 172800000);
    const earlierPastDate = new Date(Date.now() - 86400000);

    await expect(
      createLeaveRequest(makeLeaveData({
        startTime: earlierPastDate,
        endTime: pastDate,
      })),
    ).rejects.toThrow('Start time must be in the future');
  });
});
