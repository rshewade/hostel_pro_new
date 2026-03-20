import { describe, it, expect } from 'vitest';
import { isStaff, isAdmin } from '../rbac';

// isStaff and isAdmin are pure synchronous functions — no DB or Next.js
// dependencies — so no mocking is needed here.

type UserRole = 'STUDENT' | 'SUPERINTENDENT' | 'TRUSTEE' | 'ACCOUNTS' | 'PARENT';

// ---------------------------------------------------------------------------
// isStaff
// ---------------------------------------------------------------------------

describe('isStaff', () => {
  it('returns true for SUPERINTENDENT', () => {
    expect(isStaff('SUPERINTENDENT')).toBe(true);
  });

  it('returns true for TRUSTEE', () => {
    expect(isStaff('TRUSTEE')).toBe(true);
  });

  it('returns true for ACCOUNTS', () => {
    expect(isStaff('ACCOUNTS')).toBe(true);
  });

  it('returns false for STUDENT', () => {
    expect(isStaff('STUDENT')).toBe(false);
  });

  it('returns false for PARENT', () => {
    expect(isStaff('PARENT')).toBe(false);
  });

  it('returns the correct boolean type', () => {
    expect(typeof isStaff('SUPERINTENDENT')).toBe('boolean');
    expect(typeof isStaff('STUDENT')).toBe('boolean');
  });

  it('covers all five roles exhaustively', () => {
    const roles: UserRole[] = ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS', 'PARENT'];
    const expectedStaff: Record<UserRole, boolean> = {
      STUDENT: false,
      SUPERINTENDENT: true,
      TRUSTEE: true,
      ACCOUNTS: true,
      PARENT: false,
    };
    for (const role of roles) {
      expect(isStaff(role)).toBe(expectedStaff[role]);
    }
  });
});

// ---------------------------------------------------------------------------
// isAdmin
// ---------------------------------------------------------------------------

describe('isAdmin', () => {
  it('returns true for TRUSTEE', () => {
    expect(isAdmin('TRUSTEE')).toBe(true);
  });

  it('returns true for ACCOUNTS', () => {
    expect(isAdmin('ACCOUNTS')).toBe(true);
  });

  it('returns false for SUPERINTENDENT', () => {
    expect(isAdmin('SUPERINTENDENT')).toBe(false);
  });

  it('returns false for STUDENT', () => {
    expect(isAdmin('STUDENT')).toBe(false);
  });

  it('returns false for PARENT', () => {
    expect(isAdmin('PARENT')).toBe(false);
  });

  it('returns the correct boolean type', () => {
    expect(typeof isAdmin('TRUSTEE')).toBe('boolean');
    expect(typeof isAdmin('STUDENT')).toBe('boolean');
  });

  it('covers all five roles exhaustively', () => {
    const roles: UserRole[] = ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS', 'PARENT'];
    const expectedAdmin: Record<UserRole, boolean> = {
      STUDENT: false,
      SUPERINTENDENT: false,
      TRUSTEE: true,
      ACCOUNTS: true,
      PARENT: false,
    };
    for (const role of roles) {
      expect(isAdmin(role)).toBe(expectedAdmin[role]);
    }
  });

  it('TRUSTEE and ACCOUNTS are both admin (union coverage)', () => {
    const adminRoles: UserRole[] = ['TRUSTEE', 'ACCOUNTS'];
    for (const role of adminRoles) {
      expect(isAdmin(role)).toBe(true);
    }
  });

  it('non-admin roles are consistently false', () => {
    const nonAdminRoles: UserRole[] = ['STUDENT', 'SUPERINTENDENT', 'PARENT'];
    for (const role of nonAdminRoles) {
      expect(isAdmin(role)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Relationship between isStaff and isAdmin
// ---------------------------------------------------------------------------

describe('isStaff vs isAdmin relationship', () => {
  it('every admin is also staff', () => {
    const roles: UserRole[] = ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS', 'PARENT'];
    for (const role of roles) {
      if (isAdmin(role)) {
        expect(isStaff(role)).toBe(true);
      }
    }
  });

  it('not every staff member is admin (SUPERINTENDENT is staff but not admin)', () => {
    expect(isStaff('SUPERINTENDENT')).toBe(true);
    expect(isAdmin('SUPERINTENDENT')).toBe(false);
  });

  it('non-staff roles are never admin', () => {
    const nonStaffRoles: UserRole[] = ['STUDENT', 'PARENT'];
    for (const role of nonStaffRoles) {
      expect(isStaff(role)).toBe(false);
      expect(isAdmin(role)).toBe(false);
    }
  });
});
