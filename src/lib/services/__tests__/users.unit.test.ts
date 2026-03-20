import { describe, it, expect } from 'vitest';
import { extractUserRole, extractUserVertical } from '../users';

describe('UsersService (unit)', () => {
  describe('extractUserRole', () => {
    it('extracts valid role', () => {
      expect(extractUserRole({ role: 'SUPERINTENDENT' })).toBe('SUPERINTENDENT');
    });

    it('normalizes case', () => {
      expect(extractUserRole({ role: 'trustee' })).toBe('TRUSTEE');
    });

    it('defaults to STUDENT for unknown role', () => {
      expect(extractUserRole({ role: 'UNKNOWN' })).toBe('STUDENT');
    });

    it('defaults to STUDENT for missing role', () => {
      expect(extractUserRole({})).toBe('STUDENT');
    });

    it('accepts all valid roles', () => {
      for (const role of ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS', 'PARENT']) {
        expect(extractUserRole({ role })).toBe(role);
      }
    });
  });

  describe('extractUserVertical', () => {
    it('extracts valid vertical', () => {
      expect(extractUserVertical({ vertical: 'BOYS' })).toBe('BOYS');
    });

    it('normalizes case', () => {
      expect(extractUserVertical({ vertical: 'girls' })).toBe('GIRLS');
    });

    it('returns undefined for invalid vertical', () => {
      expect(extractUserVertical({ vertical: 'INVALID' })).toBeUndefined();
    });

    it('returns undefined for missing vertical', () => {
      expect(extractUserVertical({})).toBeUndefined();
    });
  });
});
