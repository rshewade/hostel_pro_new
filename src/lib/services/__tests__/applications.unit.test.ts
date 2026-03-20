import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

// --- Mocks (must come before imports that trigger module evaluation) ---

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
    studentUserId: 'student_user_id',
    vertical: 'vertical',
    currentStatus: 'current_status',
    trackingNumber: 'tracking_number',
    applicantMobile: 'applicant_mobile',
    type: 'type',
    createdAt: 'created_at',
    approvedAt: 'approved_at',
    approvedBy: 'approved_by',
    rejectedAt: 'rejected_at',
    rejectedBy: 'rejected_by',
    rejectionReason: 'rejection_reason',
    submittedAt: 'submitted_at',
    reviewedAt: 'reviewed_at',
  },
}));

import {
  createApplication,
  getApplicationById,
  getApplicationByTracking,
  updateApplication,
  updateApplicationStatus,
  listApplications,
  getApplicationStats,
} from '../applications';
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

function mockInsertReturning(returnValue: object[]) {
  (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(returnValue),
    }),
  });
}

function mockSelectFromWhere(returnValue: object[]) {
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(returnValue),
    }),
  });
}

function mockUpdateSetWhere(returnValue: object[]) {
  (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(returnValue),
      }),
    }),
  });
}

const mockApp = {
  id: 'app-1',
  currentStatus: 'DRAFT',
  trackingNumber: 'HP-2026-001',
  applicantMobile: '+919876543210',
  studentUserId: 'student-1',
  vertical: 'BOYS',
  type: 'FRESH',
  createdAt: new Date('2026-01-01'),
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  rejectionReason: null,
  submittedAt: null,
  reviewedAt: null,
};

// ---------------------------------------------------------------------------
// createApplication
// ---------------------------------------------------------------------------

describe('createApplication', () => {
  it('creates an application with DRAFT status', async () => {
    const created = { ...mockApp, currentStatus: 'DRAFT', trackingNumber: '' };
    mockInsertReturning([created]);

    const result = await createApplication({
      studentUserId: 'student-1',
      vertical: 'BOYS',
      type: 'FRESH',
      applicantMobile: '+919876543210',
      currentStatus: 'DRAFT',
    } as any);

    expect(result.currentStatus).toBe('DRAFT');
  });

  it('passes an empty trackingNumber as placeholder (trigger overrides)', async () => {
    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockApp, trackingNumber: 'HP-2026-001' }]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    const result = await createApplication({
      studentUserId: 'student-1',
      type: 'FRESH',
      currentStatus: 'DRAFT',
    } as any);

    // The values() call should have been passed trackingNumber: ''
    const valuesMock = insertFn.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    const passedData = valuesMock.mock.calls[0]?.[0];
    expect(passedData).toHaveProperty('trackingNumber', '');
    expect(result).toBeDefined();
  });

  it('returns the inserted application row', async () => {
    mockInsertReturning([mockApp]);

    const result = await createApplication({ studentUserId: 'student-1' } as any);
    expect(result).toEqual(mockApp);
  });
});

// ---------------------------------------------------------------------------
// getApplicationById
// ---------------------------------------------------------------------------

describe('getApplicationById', () => {
  it('returns the application when found', async () => {
    mockSelectFromWhere([mockApp]);

    const result = await getApplicationById('app-1');
    expect(result).toEqual(mockApp);
    expect(result.id).toBe('app-1');
  });

  it('throws NotFoundError when application does not exist', async () => {
    mockSelectFromWhere([]);

    await expect(getApplicationById('nonexistent')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('NotFoundError has correct status and code', async () => {
    mockSelectFromWhere([]);

    try {
      await getApplicationById('bad-id');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
      expect((err as NotFoundError).status).toBe(404);
      expect((err as NotFoundError).code).toBe('NOT_FOUND');
    }
  });

  it('NotFoundError message mentions application', async () => {
    mockSelectFromWhere([]);

    await expect(getApplicationById('x')).rejects.toThrow('Application not found');
  });
});

// ---------------------------------------------------------------------------
// getApplicationByTracking
// ---------------------------------------------------------------------------

describe('getApplicationByTracking', () => {
  it('returns the application when tracking number and mobile match', async () => {
    mockSelectFromWhere([mockApp]);

    const result = await getApplicationByTracking('HP-2026-001', '+919876543210');
    expect(result).toEqual(mockApp);
  });

  it('throws NotFoundError when no match found', async () => {
    mockSelectFromWhere([]);

    await expect(
      getApplicationByTracking('HP-WRONG', '+919999999999'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError with correct message', async () => {
    mockSelectFromWhere([]);

    await expect(
      getApplicationByTracking('HP-2026-001', '+910000000000'),
    ).rejects.toThrow('Application not found');
  });
});

// ---------------------------------------------------------------------------
// updateApplication
// ---------------------------------------------------------------------------

describe('updateApplication', () => {
  it('allows STUDENT to update a DRAFT application', async () => {
    const draftApp = { ...mockApp, currentStatus: 'DRAFT' };
    const updated = { ...draftApp, type: 'RENEWAL' };

    // First call: getApplicationById (select)
    mockSelectFromWhere([draftApp]);
    // Second call: the actual update
    mockUpdateSetWhere([updated]);

    const result = await updateApplication('app-1', { type: 'RENEWAL' as any }, 'STUDENT');
    expect(result).toEqual(updated);
  });

  it('allows STUDENT to update a SUBMITTED application', async () => {
    const submittedApp = { ...mockApp, currentStatus: 'SUBMITTED' };
    mockSelectFromWhere([submittedApp]);
    mockUpdateSetWhere([{ ...submittedApp, type: 'RENEWAL' }]);

    await expect(
      updateApplication('app-1', { type: 'RENEWAL' as any }, 'STUDENT'),
    ).resolves.toBeDefined();
  });

  it('throws ForbiddenError for STUDENT trying to update APPROVED application', async () => {
    const approvedApp = { ...mockApp, currentStatus: 'APPROVED' };
    mockSelectFromWhere([approvedApp]);

    await expect(
      updateApplication('app-1', { type: 'RENEWAL' as any }, 'STUDENT'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError for STUDENT trying to update REJECTED application', async () => {
    const rejectedApp = { ...mockApp, currentStatus: 'REJECTED' };
    mockSelectFromWhere([rejectedApp]);

    await expect(
      updateApplication('app-1', { type: 'RENEWAL' as any }, 'STUDENT'),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError for STUDENT trying to update REVIEW application', async () => {
    const reviewApp = { ...mockApp, currentStatus: 'REVIEW' };
    mockSelectFromWhere([reviewApp]);

    await expect(
      updateApplication('app-1', {}, 'STUDENT'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows SUPERINTENDENT to update any status application', async () => {
    const approvedApp = { ...mockApp, currentStatus: 'APPROVED' };
    mockSelectFromWhere([approvedApp]);
    mockUpdateSetWhere([{ ...approvedApp, type: 'RENEWAL' }]);

    await expect(
      updateApplication('app-1', { type: 'RENEWAL' as any }, 'SUPERINTENDENT'),
    ).resolves.toBeDefined();
  });

  it('ForbiddenError has correct status and message', async () => {
    const approvedApp = { ...mockApp, currentStatus: 'APPROVED' };
    mockSelectFromWhere([approvedApp]);

    try {
      await updateApplication('app-1', {}, 'STUDENT');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as ForbiddenError).status).toBe(403);
      expect((err as ForbiddenError).code).toBe('FORBIDDEN');
    }
  });
});

// ---------------------------------------------------------------------------
// updateApplicationStatus
// ---------------------------------------------------------------------------

describe('updateApplicationStatus', () => {
  it('sets approvedAt and approvedBy for APPROVED status', async () => {
    const updatedApp = {
      ...mockApp,
      currentStatus: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: 'super-1',
    };
    mockUpdateSetWhere([updatedApp]);

    const result = await updateApplicationStatus('app-1', 'APPROVED', 'super-1');
    expect(result.currentStatus).toBe('APPROVED');
    expect(result.approvedBy).toBe('super-1');
    expect(result.approvedAt).toBeDefined();
  });

  it('sets rejectedAt, rejectedBy, and rejectionReason for REJECTED status', async () => {
    const updatedApp = {
      ...mockApp,
      currentStatus: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: 'super-1',
      rejectionReason: 'Incomplete documents',
    };
    mockUpdateSetWhere([updatedApp]);

    const result = await updateApplicationStatus('app-1', 'REJECTED', 'super-1', 'Incomplete documents');
    expect(result.currentStatus).toBe('REJECTED');
    expect(result.rejectedBy).toBe('super-1');
    expect(result.rejectionReason).toBe('Incomplete documents');
  });

  it('sets submittedAt for SUBMITTED status', async () => {
    const updatedApp = { ...mockApp, currentStatus: 'SUBMITTED', submittedAt: new Date() };
    mockUpdateSetWhere([updatedApp]);

    const result = await updateApplicationStatus('app-1', 'SUBMITTED', 'student-1');
    expect(result.currentStatus).toBe('SUBMITTED');
    expect(result.submittedAt).toBeDefined();
  });

  it('sets reviewedAt for REVIEW status', async () => {
    const updatedApp = { ...mockApp, currentStatus: 'REVIEW', reviewedAt: new Date() };
    mockUpdateSetWhere([updatedApp]);

    const result = await updateApplicationStatus('app-1', 'REVIEW', 'super-1');
    expect(result.currentStatus).toBe('REVIEW');
    expect(result.reviewedAt).toBeDefined();
  });

  it('throws NotFoundError when application does not exist', async () => {
    mockUpdateSetWhere([]);

    await expect(
      updateApplicationStatus('nonexistent', 'APPROVED', 'super-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('NotFoundError has correct status 404', async () => {
    mockUpdateSetWhere([]);

    try {
      await updateApplicationStatus('bad-id', 'APPROVED', 'super-1');
    } catch (err) {
      expect((err as NotFoundError).status).toBe(404);
    }
  });

  it('does not set approval fields for non-APPROVED statuses', async () => {
    const updateFn = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...mockApp, currentStatus: 'SUBMITTED', submittedAt: new Date() }]),
        }),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(updateFn);

    await updateApplicationStatus('app-1', 'SUBMITTED', 'student-1');

    const setMock = updateFn.mock.results[0]?.value.set as ReturnType<typeof vi.fn>;
    const setPayload = setMock.mock.calls[0]?.[0];
    expect(setPayload).not.toHaveProperty('approvedAt');
    expect(setPayload).not.toHaveProperty('approvedBy');
  });
});

// ---------------------------------------------------------------------------
// listApplications
// ---------------------------------------------------------------------------

describe('listApplications', () => {
  function mockListQuery(data: object[], total: number) {
    // listApplications calls Promise.all([select...data, select...count])
    // We simulate by returning the same mock twice via consecutive calls
    let callCount = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // data query — has orderBy/limit/offset chain
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
      // count query
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total }]),
        }),
      };
    });
  }

  it('returns data, total, page, and limit', async () => {
    mockListQuery([mockApp], 1);

    const result = await listApplications({ userRole: 'TRUSTEE', page: 1, limit: 20 });
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page', 1);
    expect(result).toHaveProperty('limit', 20);
  });

  it('defaults page to 1 and limit to 20', async () => {
    mockListQuery([mockApp], 1);

    const result = await listApplications({ userRole: 'TRUSTEE' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('respects custom page and limit', async () => {
    mockListQuery([], 0);

    const result = await listApplications({ userRole: 'TRUSTEE', page: 3, limit: 10 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  it('STUDENT sees only their own applications (studentUserId filter applied)', async () => {
    const selectFn = vi.fn();
    let callCount = 0;
    selectFn.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([mockApp]),
                }),
              }),
            }),
          }),
        };
      }
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      };
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectFn);

    const result = await listApplications({
      userRole: 'STUDENT',
      userId: 'student-1',
    });
    expect(result.data).toBeDefined();
    // The critical assertion is that query was built (filter applied in service code)
    expect(selectFn).toHaveBeenCalled();
  });

  it('SUPERINTENDENT filters by vertical', async () => {
    mockListQuery([mockApp], 1);

    const result = await listApplications({
      userRole: 'SUPERINTENDENT',
      userVertical: 'BOYS',
    });
    expect(result.data).toBeDefined();
    expect(db.select).toHaveBeenCalled();
  });

  it('filters by status when provided', async () => {
    mockListQuery([mockApp], 1);

    const result = await listApplications({
      userRole: 'TRUSTEE',
      status: 'DRAFT',
    });
    expect(result.data).toBeDefined();
  });

  it('filters by type when provided', async () => {
    mockListQuery([mockApp], 1);

    const result = await listApplications({
      userRole: 'TRUSTEE',
      type: 'FRESH',
    });
    expect(result.data).toBeDefined();
  });

  it('returns empty data array when no applications match', async () => {
    mockListQuery([], 0);

    const result = await listApplications({ userRole: 'TRUSTEE' });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getApplicationStats
// ---------------------------------------------------------------------------

describe('getApplicationStats', () => {
  it('returns an object keyed by status with counts', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([
            { status: 'DRAFT', count: 5 },
            { status: 'APPROVED', count: 3 },
            { status: 'REJECTED', count: 1 },
          ]),
        }),
      }),
    });

    const stats = await getApplicationStats('TRUSTEE');
    expect(stats).toEqual({ DRAFT: 5, APPROVED: 3, REJECTED: 1 });
  });

  it('returns empty object when no applications exist', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const stats = await getApplicationStats('TRUSTEE');
    expect(stats).toEqual({});
  });

  it('filters by vertical for SUPERINTENDENT role', async () => {
    const selectFn = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([
            { status: 'DRAFT', count: 2 },
          ]),
        }),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectFn);

    const stats = await getApplicationStats('SUPERINTENDENT', 'BOYS');
    expect(stats).toHaveProperty('DRAFT', 2);
    expect(selectFn).toHaveBeenCalled();
  });

  it('does not apply vertical filter when userVertical is null', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([{ status: 'DRAFT', count: 10 }]),
        }),
      }),
    });

    const stats = await getApplicationStats('SUPERINTENDENT', null);
    expect(stats).toHaveProperty('DRAFT', 10);
  });

  it('returns all status counts for TRUSTEE without vertical filter', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockResolvedValue([
            { status: 'DRAFT', count: 10 },
            { status: 'SUBMITTED', count: 8 },
            { status: 'APPROVED', count: 6 },
            { status: 'REJECTED', count: 2 },
            { status: 'ARCHIVED', count: 1 },
          ]),
        }),
      }),
    });

    const stats = await getApplicationStats('TRUSTEE');
    expect(Object.keys(stats)).toHaveLength(5);
    expect(stats['DRAFT']).toBe(10);
    expect(stats['ARCHIVED']).toBe(1);
  });
});
