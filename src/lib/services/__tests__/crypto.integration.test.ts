import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, hash, generateKey } from '../crypto';

// Integration test: verify crypto works end-to-end with real keys
beforeAll(() => {
  process.env.ENCRYPTION_KEY = generateKey();
  process.env.HASH_SALT = generateKey().slice(0, 32);
});

describe('CryptoService (integration)', () => {
  it('encrypts sensitive PII data and decrypts it back', () => {
    const piiData = {
      phone: '+919876543210',
      email: 'student@example.com',
      address: '123, MG Road, Pune, Maharashtra 411001',
      aadhaar: '1234-5678-9012',
    };

    // Encrypt each field
    const encrypted = {
      phone: encrypt(piiData.phone),
      email: encrypt(piiData.email),
      address: encrypt(piiData.address),
      aadhaar: encrypt(piiData.aadhaar),
    };

    // Verify nothing is plaintext
    expect(encrypted.phone).not.toBe(piiData.phone);
    expect(encrypted.email).not.toBe(piiData.email);

    // Decrypt and verify
    expect(decrypt(encrypted.phone)).toBe(piiData.phone);
    expect(decrypt(encrypted.email)).toBe(piiData.email);
    expect(decrypt(encrypted.address)).toBe(piiData.address);
    expect(decrypt(encrypted.aadhaar)).toBe(piiData.aadhaar);
  });

  it('hash is consistent and can be used for lookups', () => {
    const phone = '+919876543210';
    const hash1 = hash(phone);
    const hash2 = hash(phone);
    expect(hash1).toBe(hash2);

    // Different phones produce different hashes
    const hash3 = hash('+919999999999');
    expect(hash1).not.toBe(hash3);
  });

  it('handles large data blocks', () => {
    const largeData = 'x'.repeat(10000);
    const encrypted = encrypt(largeData);
    expect(decrypt(encrypted)).toBe(largeData);
  });
});
