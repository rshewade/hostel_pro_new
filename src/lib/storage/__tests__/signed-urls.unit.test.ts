import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

import { generateSignedUrl, verifySignedUrl } from '../signed-urls';

afterEach(() => {
  vi.useRealTimers();
});

describe('generateSignedUrl', () => {
  it('returns url, token, and expiresAt', () => {
    const result = generateSignedUrl('uploads/test/file.pdf');

    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('expiresAt');
  });

  it('url contains the path and query parameters', () => {
    const result = generateSignedUrl('uploads/test/file.pdf');

    expect(result.url).toContain('/api/storage/uploads/test/file.pdf');
    expect(result.url).toContain(`token=${result.token}`);
    expect(result.url).toContain(`expires=${result.expiresAt}`);
  });

  it('token is a hex string (SHA-256 HMAC)', () => {
    const result = generateSignedUrl('test/path.jpg');

    // SHA-256 HMAC hex = 64 characters
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('expiresAt is in the future', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = generateSignedUrl('test/path.jpg');

    expect(result.expiresAt).toBeGreaterThan(now);
  });

  it('uses default expiry of 1 hour', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = generateSignedUrl('test/path.jpg');

    // Should be approximately 3600 seconds from now
    expect(result.expiresAt - now).toBeGreaterThanOrEqual(3599);
    expect(result.expiresAt - now).toBeLessThanOrEqual(3601);
  });

  it('respects custom expiry duration', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = generateSignedUrl('test/path.jpg', 300); // 5 minutes

    expect(result.expiresAt - now).toBeGreaterThanOrEqual(299);
    expect(result.expiresAt - now).toBeLessThanOrEqual(301);
  });

  it('generates different tokens for different paths', () => {
    const result1 = generateSignedUrl('path/a.pdf');
    const result2 = generateSignedUrl('path/b.pdf');

    expect(result1.token).not.toBe(result2.token);
  });

  it('generates same token for same path and expiry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));

    const result1 = generateSignedUrl('same/path.pdf', 3600);
    const result2 = generateSignedUrl('same/path.pdf', 3600);

    expect(result1.token).toBe(result2.token);
    expect(result1.expiresAt).toBe(result2.expiresAt);
  });
});

describe('verifySignedUrl', () => {
  it('returns true for a valid token', () => {
    const { token, expiresAt } = generateSignedUrl('test/file.pdf');

    const isValid = verifySignedUrl('test/file.pdf', token, String(expiresAt));
    expect(isValid).toBe(true);
  });

  it('returns false for an expired token', () => {
    vi.useFakeTimers();

    // Generate URL that expires in 10 seconds
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { token, expiresAt } = generateSignedUrl('test/file.pdf', 10);

    // Advance time past expiry
    vi.setSystemTime(new Date('2026-01-01T00:01:00Z'));

    const isValid = verifySignedUrl('test/file.pdf', token, String(expiresAt));
    expect(isValid).toBe(false);
  });

  it('returns false for a tampered token', () => {
    const { expiresAt } = generateSignedUrl('test/file.pdf');
    const tamperedToken = 'a'.repeat(64);

    const isValid = verifySignedUrl('test/file.pdf', tamperedToken, String(expiresAt));
    expect(isValid).toBe(false);
  });

  it('returns false for wrong path', () => {
    const { token, expiresAt } = generateSignedUrl('test/file.pdf');

    const isValid = verifySignedUrl('different/file.pdf', token, String(expiresAt));
    expect(isValid).toBe(false);
  });

  it('returns false for non-numeric expires string', () => {
    const { token } = generateSignedUrl('test/file.pdf');

    const isValid = verifySignedUrl('test/file.pdf', token, 'not-a-number');
    expect(isValid).toBe(false);
  });

  it('returns false for empty expires string', () => {
    const { token } = generateSignedUrl('test/file.pdf');

    const isValid = verifySignedUrl('test/file.pdf', token, '');
    expect(isValid).toBe(false);
  });

  it('returns false when expires is zero', () => {
    const { token } = generateSignedUrl('test/file.pdf');

    const isValid = verifySignedUrl('test/file.pdf', token, '0');
    expect(isValid).toBe(false);
  });

  it('roundtrip: generate then verify succeeds', () => {
    const paths = [
      'uploads/student/photo.jpg',
      'system-generated/receipts/user-123/RCP-202603-00001.pdf',
      'documents/id-proof.png',
    ];

    for (const path of paths) {
      const { token, expiresAt } = generateSignedUrl(path);
      expect(verifySignedUrl(path, token, String(expiresAt))).toBe(true);
    }
  });
});
