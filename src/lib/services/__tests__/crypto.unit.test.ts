import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, hash, encryptFields, decryptFields, isConfigured, generateKey } from '../crypto';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = generateKey();
  process.env.HASH_SALT = 'test-salt-value';
});

describe('CryptoService', () => {
  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts a string', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(':'); // iv:authTag:ciphertext format
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it('produces different ciphertext for same input (random IV)', () => {
      const plaintext = 'Same input';
      const a = encrypt(plaintext);
      const b = encrypt(plaintext);
      expect(a).not.toBe(b);
      expect(decrypt(a)).toBe(plaintext);
      expect(decrypt(b)).toBe(plaintext);
    });

    it('handles empty string', () => {
      const encrypted = encrypt('');
      expect(decrypt(encrypted)).toBe('');
    });

    it('handles unicode characters', () => {
      const plaintext = 'हिन्दी टेक्स्ट 🎉';
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it('passes through plaintext without colons', () => {
      expect(decrypt('not-encrypted')).toBe('not-encrypted');
    });
  });

  describe('hash', () => {
    it('produces consistent hash for same input', () => {
      const a = hash('test@example.com');
      const b = hash('test@example.com');
      expect(a).toBe(b);
    });

    it('produces different hash for different input', () => {
      const a = hash('user1@example.com');
      const b = hash('user2@example.com');
      expect(a).not.toBe(b);
    });

    it('returns hex string', () => {
      const result = hash('test');
      expect(result).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('encryptFields/decryptFields', () => {
    it('encrypts and decrypts specified fields', () => {
      const data = { name: 'Alice', phone: '+919876543210', role: 'STUDENT' };
      const encrypted = encryptFields(data, ['phone']);
      expect(encrypted.phone).not.toBe('+919876543210');
      expect(encrypted.name).toBe('Alice'); // untouched
      expect(encrypted.role).toBe('STUDENT'); // untouched

      const decrypted = decryptFields(encrypted, ['phone']);
      expect(decrypted.phone).toBe('+919876543210');
    });

    it('handles non-string fields gracefully', () => {
      const data = { name: 'Alice', count: 42 };
      const encrypted = encryptFields(data, ['count' as keyof typeof data]);
      expect(encrypted.count).toBe(42); // non-string, untouched
    });
  });

  describe('isConfigured', () => {
    it('returns true when ENCRYPTION_KEY is set', () => {
      expect(isConfigured()).toBe(true);
    });
  });

  describe('generateKey', () => {
    it('returns 64 character hex string', () => {
      const key = generateKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]+$/);
    });
  });
});
