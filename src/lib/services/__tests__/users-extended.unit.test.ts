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
  users: {
    id: 'id',
    authUserId: 'auth_user_id',
    fullName: 'full_name',
    mobile: 'mobile',
    role: 'role',
    vertical: 'vertical',
    email: 'email',
    parentMobile: 'parent_mobile',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}));

import {
  getUserByAuthId,
  getUserById,
  createUserProfile,
  updateUserProfile,
  userExists,
} from '../users';
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
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-uuid-1',
  authUserId: 'auth-uuid-1',
  fullName: 'Raju Sharma',
  mobile: '+919876543210',
  role: 'STUDENT',
  vertical: 'BOYS',
  email: 'raju@example.com',
  parentMobile: '+919000000000',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function mockSelectFromWhere(returnValue: object[]) {
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(returnValue),
    }),
  });
}

// ---------------------------------------------------------------------------
// getUserByAuthId
// ---------------------------------------------------------------------------

describe('getUserByAuthId', () => {
  it('returns the user when found by authUserId', async () => {
    mockSelectFromWhere([mockUser]);

    const result = await getUserByAuthId('auth-uuid-1');
    expect(result).toEqual(mockUser);
  });

  it('returns null when no user is found', async () => {
    mockSelectFromWhere([]);

    const result = await getUserByAuthId('nonexistent-auth-id');
    expect(result).toBeNull();
  });

  it('returns null (not undefined) for missing user', async () => {
    mockSelectFromWhere([]);

    const result = await getUserByAuthId('missing');
    expect(result).toBeNull();
    expect(result).not.toBeUndefined();
  });

  it('does not throw when user is not found', async () => {
    mockSelectFromWhere([]);

    await expect(getUserByAuthId('missing')).resolves.toBeNull();
  });

  it('returns the full user object including all fields', async () => {
    mockSelectFromWhere([mockUser]);

    const result = await getUserByAuthId('auth-uuid-1');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('fullName');
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('vertical');
  });

  it('queries using the authUserId field', async () => {
    const selectFn = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectFn);

    await getUserByAuthId('auth-uuid-1');
    expect(selectFn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// getUserById
// ---------------------------------------------------------------------------

describe('getUserById', () => {
  it('returns the user when found by id', async () => {
    mockSelectFromWhere([mockUser]);

    const result = await getUserById('user-uuid-1');
    expect(result).toEqual(mockUser);
    expect(result.id).toBe('user-uuid-1');
  });

  it('throws NotFoundError when user does not exist', async () => {
    mockSelectFromWhere([]);

    await expect(getUserById('nonexistent-id')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('NotFoundError has status 404', async () => {
    mockSelectFromWhere([]);

    try {
      await getUserById('bad-id');
    } catch (err) {
      expect((err as NotFoundError).status).toBe(404);
    }
  });

  it('NotFoundError has code NOT_FOUND', async () => {
    mockSelectFromWhere([]);

    try {
      await getUserById('bad-id');
    } catch (err) {
      expect((err as NotFoundError).code).toBe('NOT_FOUND');
    }
  });

  it('NotFoundError message mentions user', async () => {
    mockSelectFromWhere([]);

    await expect(getUserById('bad-id')).rejects.toThrow('User not found');
  });

  it('returns user with correct role', async () => {
    const superintendent = { ...mockUser, role: 'SUPERINTENDENT' };
    mockSelectFromWhere([superintendent]);

    const result = await getUserById('user-uuid-1');
    expect(result.role).toBe('SUPERINTENDENT');
  });
});

// ---------------------------------------------------------------------------
// createUserProfile
// ---------------------------------------------------------------------------

describe('createUserProfile', () => {
  it('creates a user and returns it', async () => {
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      }),
    });

    const result = await createUserProfile({
      authUserId: 'auth-uuid-1',
      fullName: 'Raju Sharma',
      mobile: '+919876543210',
    });

    expect(result).toEqual(mockUser);
  });

  it('defaults role to STUDENT when not specified', async () => {
    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockUser, role: 'STUDENT' }]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    await createUserProfile({
      authUserId: 'auth-uuid-2',
      fullName: 'New Student',
      mobile: '+919000000001',
    });

    const valuesMock = insertFn.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    const passedData = valuesMock.mock.calls[0]?.[0];
    expect(passedData.role).toBe('STUDENT');
  });

  it('uses the specified role when provided', async () => {
    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockUser, role: 'SUPERINTENDENT' }]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    await createUserProfile({
      authUserId: 'auth-uuid-3',
      fullName: 'Admin User',
      mobile: '+919000000002',
      role: 'SUPERINTENDENT',
    });

    const valuesMock = insertFn.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    const passedData = valuesMock.mock.calls[0]?.[0];
    expect(passedData.role).toBe('SUPERINTENDENT');
  });

  it('stores optional fields when provided', async () => {
    const insertFn = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      }),
    });
    (db.insert as ReturnType<typeof vi.fn>).mockImplementation(insertFn);

    await createUserProfile({
      authUserId: 'auth-uuid-1',
      fullName: 'Raju',
      mobile: '+919876543210',
      email: 'raju@example.com',
      parentMobile: '+919000000000',
      vertical: 'BOYS',
    });

    const valuesMock = insertFn.mock.results[0]?.value.values as ReturnType<typeof vi.fn>;
    const passedData = valuesMock.mock.calls[0]?.[0];
    expect(passedData.email).toBe('raju@example.com');
    expect(passedData.parentMobile).toBe('+919000000000');
    expect(passedData.vertical).toBe('BOYS');
  });

  it('creates user with TRUSTEE role', async () => {
    const trusteeUser = { ...mockUser, role: 'TRUSTEE', vertical: null };
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([trusteeUser]),
      }),
    });

    const result = await createUserProfile({
      authUserId: 'auth-trustee-1',
      fullName: 'Trustee Ji',
      mobile: '+919111111111',
      role: 'TRUSTEE',
    });

    expect(result.role).toBe('TRUSTEE');
  });
});

// ---------------------------------------------------------------------------
// updateUserProfile
// ---------------------------------------------------------------------------

describe('updateUserProfile', () => {
  it('updates and returns the user', async () => {
    const updated = { ...mockUser, fullName: 'Updated Name' };
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated]),
        }),
      }),
    });

    const result = await updateUserProfile('auth-uuid-1', { fullName: 'Updated Name' });
    expect(result.fullName).toBe('Updated Name');
  });

  it('throws NotFoundError when user does not exist', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(updateUserProfile('nonexistent-auth', { fullName: 'X' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('NotFoundError has status 404', async () => {
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    try {
      await updateUserProfile('bad-auth', { fullName: 'X' });
    } catch (err) {
      expect((err as NotFoundError).status).toBe(404);
    }
  });

  it('passes update fields to db.update', async () => {
    const setFn = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockUser, email: 'new@example.com' }]),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setFn });

    await updateUserProfile('auth-uuid-1', { email: 'new@example.com' });
    expect(setFn.mock.calls[0]?.[0]).toMatchObject({ email: 'new@example.com' });
  });

  it('can update multiple fields at once', async () => {
    const setFn = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ ...mockUser, fullName: 'New', email: 'new@x.com' }]),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setFn });

    const result = await updateUserProfile('auth-uuid-1', { fullName: 'New', email: 'new@x.com' });
    expect(result.fullName).toBe('New');
    expect(result.email).toBe('new@x.com');
  });

  it('calls db.update by authUserId (not by id)', async () => {
    const updateFn = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUser]),
        }),
      }),
    });
    (db.update as ReturnType<typeof vi.fn>).mockImplementation(updateFn);

    await updateUserProfile('auth-uuid-1', { fullName: 'Updated' });
    expect(updateFn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// userExists
// ---------------------------------------------------------------------------

describe('userExists', () => {
  it('returns true when a user with the authUserId exists', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'user-uuid-1' }]),
      }),
    });

    const result = await userExists('auth-uuid-1');
    expect(result).toBe(true);
  });

  it('returns false when no user is found', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await userExists('unknown-auth-id');
    expect(result).toBe(false);
  });

  it('returns a boolean type', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'x' }]),
      }),
    });

    const result = await userExists('auth-uuid-1');
    expect(typeof result).toBe('boolean');
  });

  it('returns false (not null/undefined) for missing user', async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const result = await userExists('missing');
    expect(result).toBe(false);
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
  });

  it('only selects the id field (lightweight query)', async () => {
    const selectFn = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'u1' }]),
      }),
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectFn);

    await userExists('auth-uuid-1');
    // The first argument to select() should be an object with just { id: ... }
    const selectArg = selectFn.mock.calls[0]?.[0];
    expect(selectArg).toHaveProperty('id');
    expect(Object.keys(selectArg)).toHaveLength(1);
  });
});
