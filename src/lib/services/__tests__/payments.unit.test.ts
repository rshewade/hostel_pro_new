import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the db module before importing the service
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: '1' }]),
      }),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  fees: {
    id: 'id',
    studentUserId: 'student_user_id',
    status: 'status',
    createdAt: 'created_at',
    amount: 'amount',
    dueDate: 'due_date',
    waivedAmount: 'waived_amount',
  },
  payments: {
    id: 'id',
    createdAt: 'created_at',
  },
}));

import { generateReceiptNumber, getPaymentSummary } from '../payments';
import { db } from '@/lib/db';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

describe('generateReceiptNumber', () => {
  it('returns correct format RCP-YYYYMM-NNNNN', async () => {
    // Mock the db.select chain for counting payments
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 42 }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const receipt = await generateReceiptNumber();

    const now = new Date();
    const expectedPrefix = `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    expect(receipt).toMatch(/^RCP-\d{6}-\d{5}$/);
    expect(receipt.startsWith(expectedPrefix)).toBe(true);
  });

  it('pads sequence number to 5 digits', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const receipt = await generateReceiptNumber();
    // count=0 => seq=1 => 00001
    expect(receipt).toMatch(/-00001$/);
  });

  it('increments sequence based on existing count', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 99 }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const receipt = await generateReceiptNumber();
    expect(receipt).toMatch(/-00100$/);
  });

  it('handles null count result gracefully', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: undefined }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const receipt = await generateReceiptNumber();
    expect(receipt).toMatch(/-00001$/);
  });

  it('formats single-digit month with leading zero', async () => {
    const mockDate = new Date(2026, 0, 15); // January = month 0
    vi.setSystemTime(mockDate);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const receipt = await generateReceiptNumber();
    expect(receipt.startsWith('RCP-202601-')).toBe(true);

    vi.useRealTimers();
  });

  it('formats double-digit month correctly', async () => {
    const mockDate = new Date(2026, 11, 1); // December = month 11
    vi.setSystemTime(mockDate);

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const receipt = await generateReceiptNumber();
    expect(receipt.startsWith('RCP-202612-')).toBe(true);
    expect(receipt).toMatch(/-00006$/);

    vi.useRealTimers();
  });
});

describe('getPaymentSummary', () => {
  it('calculates totals correctly with mixed fee statuses', async () => {
    const mockFees = [
      { amount: '5000', status: 'PAID', dueDate: '2025-01-01' },
      { amount: '3000', status: 'PENDING', dueDate: '2099-06-01' },
      { amount: '2000', status: 'WAIVED', dueDate: '2025-03-01' },
      { amount: '1000', status: 'PENDING', dueDate: '2024-01-01' }, // overdue
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockFees),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const summary = await getPaymentSummary('student-1');

    expect(summary.totalDue).toBe(11000);
    expect(summary.totalPaid).toBe(7000); // PAID(5000) + WAIVED(2000)
    expect(summary.totalPending).toBe(4000); // 11000 - 7000
    expect(summary.overdueFees).toBe(1); // only the one with past dueDate and PENDING
  });

  it('returns zeros for student with no fees', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const summary = await getPaymentSummary('no-fees-student');

    expect(summary.totalDue).toBe(0);
    expect(summary.totalPaid).toBe(0);
    expect(summary.totalPending).toBe(0);
    expect(summary.overdueFees).toBe(0);
  });

  it('counts multiple overdue fees correctly', async () => {
    const mockFees = [
      { amount: '1000', status: 'PENDING', dueDate: '2020-01-01' },
      { amount: '2000', status: 'PENDING', dueDate: '2020-06-01' },
      { amount: '3000', status: 'PAID', dueDate: '2020-03-01' },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockFees),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const summary = await getPaymentSummary('student-2');
    expect(summary.overdueFees).toBe(2);
    expect(summary.totalDue).toBe(6000);
    expect(summary.totalPaid).toBe(3000);
  });

  it('does not count future pending fees as overdue', async () => {
    const mockFees = [
      { amount: '5000', status: 'PENDING', dueDate: '2099-12-31' },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockFees),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const summary = await getPaymentSummary('student-3');
    expect(summary.overdueFees).toBe(0);
    expect(summary.totalPending).toBe(5000);
  });

  it('does not count PAID fees as overdue even with past due date', async () => {
    const mockFees = [
      { amount: '2000', status: 'PAID', dueDate: '2020-01-01' },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockFees),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(mockSelect);

    const summary = await getPaymentSummary('student-4');
    expect(summary.overdueFees).toBe(0);
    expect(summary.totalPaid).toBe(2000);
  });
});
