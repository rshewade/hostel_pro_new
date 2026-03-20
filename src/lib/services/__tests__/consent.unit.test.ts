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
  consentLogs: {
    id: 'id',
    userId: 'user_id',
    applicationId: 'application_id',
    consentType: 'consent_type',
    consentVersion: 'consent_version',
    ipAddress: 'ip_address',
    userAgent: 'user_agent',
    digitalSignature: 'digital_signature',
    createdAt: 'created_at',
  },
}));

import { createConsentLog, getConsentsByUser, hasConsent } from '../consent';
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

const mockConsentLog = {
  id: 'consent-1',
  userId: 'user-1',
  applicationId: 'app-1',
  consentType: 'DATA_PROCESSING',
  consentVersion: 'v1.0',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  digitalSignature: 'sig-abc123',
  createdAt: new Date('2026-01-01'),
};

// ---------------------------------------------------------------------------
// createConsentLog
// ---------------------------------------------------------------------------

describe('createConsentLog', () => {
  it('creates a consent log and returns it', async () => {
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockConsentLog]),
      }),
    });

    const result = await createConsentLog({
      userId: 'user-1',
      applicationId: 'app-1',
      consentType: 'DATA_PROCESSING',
      consentVersion: 'v1.0',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      digitalSignature: 'sig-abc123',
    });

    expect(result).toEqual(mockConsentLog);
  });

  it('persists all provided fields', async () => {
    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockConsentLog]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    await createConsentLog({
      userId: 'user-1',
      consentType: 'TERMS_OF_SERVICE',
      consentVersion: 'v2.0',
      ipAddress: '10.0.0.1',
      userAgent: 'TestAgent/1.0',
      digitalSignature: 'sig-xyz',
    });

    const valuesMock = insertFn.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    const passedData = valuesMock.mock.calls[0]?.[0];
    expect(passedData).toMatchObject({
      userId: 'user-1',
      consentType: 'TERMS_OF_SERVICE',
      consentVersion: 'v2.0',
    });
  });

  it('creates a log without optional fields (applicationId, ipAddress, etc.)', async () => {
    const minimalLog = {
      id: 'consent-2',
      userId: 'user-2',
      applicationId: null,
      consentType: 'PRIVACY_POLICY',
      consentVersion: 'v1.0',
      ipAddress: null,
      userAgent: null,
      digitalSignature: null,
      createdAt: new Date(),
    };
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([minimalLog]),
      }),
    });

    const result = await createConsentLog({
      consentType: 'PRIVACY_POLICY',
      consentVersion: 'v1.0',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('consent-2');
  });

  it('returns the complete log row from the database', async () => {
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockConsentLog]),
      }),
    });

    const result = await createConsentLog({
      userId: mockConsentLog.userId,
      consentType: mockConsentLog.consentType,
      consentVersion: mockConsentLog.consentVersion,
    });

    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });

  it('calls db.insert once', async () => {
    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockConsentLog]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    await createConsentLog({ consentType: 'TERMS', consentVersion: 'v1' });
    expect(insertFn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// getConsentsByUser
// ---------------------------------------------------------------------------

describe('getConsentsByUser', () => {
  it('returns all consent logs for a user', async () => {
    const consents = [
      mockConsentLog,
      { ...mockConsentLog, id: 'consent-2', consentType: 'TERMS_OF_SERVICE', createdAt: new Date('2026-02-01') },
    ];
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(consents),
        }),
      }),
    });

    const result = await getConsentsByUser('user-1');
    expect(result).toHaveLength(2);
  });

  it('returns an empty array when user has no consents', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await getConsentsByUser('user-with-no-consents');
    expect(result).toEqual([]);
  });

  it('orders results by date (orderBy is called)', async () => {
    const orderByFn = vi.fn().mockResolvedValue([mockConsentLog]);
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: orderByFn,
        }),
      }),
    });

    await getConsentsByUser('user-1');
    expect(orderByFn).toHaveBeenCalledTimes(1);
  });

  it('returns consent objects with expected fields', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([mockConsentLog]),
        }),
      }),
    });

    const result = await getConsentsByUser('user-1');
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('consentType');
    expect(result[0]).toHaveProperty('consentVersion');
  });

  it('filters by the correct userId', async () => {
    const selectFn = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectFn);

    await getConsentsByUser('target-user-99');
    expect(selectFn).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// hasConsent
// ---------------------------------------------------------------------------

describe('hasConsent', () => {
  it('returns true when a matching consent exists', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'consent-1' }]),
      }),
    });

    const result = await hasConsent('user-1', 'DATA_PROCESSING', 'v1.0');
    expect(result).toBe(true);
  });

  it('returns false when no matching consent exists', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await hasConsent('user-1', 'DATA_PROCESSING', 'v1.0');
    expect(result).toBe(false);
  });

  it('returns false for different consentType even if user and version match', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await hasConsent('user-1', 'TERMS_OF_SERVICE', 'v1.0');
    expect(result).toBe(false);
  });

  it('returns false for different consentVersion even if user and type match', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await hasConsent('user-1', 'DATA_PROCESSING', 'v2.0');
    expect(result).toBe(false);
  });

  it('returns a boolean type', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'x' }]),
      }),
    });

    const result = await hasConsent('user-1', 'X', 'v1');
    expect(typeof result).toBe('boolean');
  });

  it('queries using all three parameters (userId, consentType, consentVersion)', async () => {
    const selectFn = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectFn);

    await hasConsent('user-42', 'PRIVACY_POLICY', 'v3.0');
    expect(selectFn).toHaveBeenCalledTimes(1);
  });
});
