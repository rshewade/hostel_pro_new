/**
 * Unit tests for OTP routes
 *
 * Covers:
 *   POST /api/otp/send    — send OTP to a phone number
 *   POST /api/otp/verify  — verify OTP code (mock mode: 123456 is valid)
 *   POST /api/otp/resend  — resend OTP to a phone number
 *
 * No auth required — these are pre-login flows.
 * getSmsProvider, isMockSmsMode, and MOCK_OTP_CODE are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockSendOtp, mockIsMockSmsMode } = vi.hoisted(() => ({
  mockSendOtp: vi.fn(),
  mockIsMockSmsMode: vi.fn(),
}));

vi.mock('@/lib/auth/otp-provider', () => ({
  getSmsProvider: vi.fn(() => ({ sendOtp: mockSendOtp })),
  isMockSmsMode: mockIsMockSmsMode,
  MOCK_OTP_CODE: '123456',
}));

// auth module is imported in verify route but only used in live mode — mock it to avoid init side effects
vi.mock('@/lib/auth', () => ({
  auth: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { POST as sendPost } from '../otp/send/route';
import { POST as verifyPost } from '../otp/verify/route';
import { POST as resendPost } from '../otp/resend/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPostRequest(url: string, body: unknown = {}): NextRequest {
  return new NextRequest(new URL(`http://localhost${url}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// POST /api/otp/send
// ---------------------------------------------------------------------------

describe('POST /api/otp/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendOtp.mockResolvedValue(undefined);
  });

  it('sends OTP and returns success with expiresIn', async () => {
    const req = createPostRequest('/api/otp/send', { phone: '+919876543210' });
    const res = await sendPost(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.expiresIn).toBe(600);
  });

  it('calls sendOtp on the SMS provider with the given phone', async () => {
    const req = createPostRequest('/api/otp/send', { phone: '+919876543210' });
    await sendPost(req);

    expect(mockSendOtp).toHaveBeenCalledWith('+919876543210', expect.any(String));
  });

  it('generates a 6-digit numeric OTP code', async () => {
    const req = createPostRequest('/api/otp/send', { phone: '+919876543210' });
    await sendPost(req);

    const [, code] = mockSendOtp.mock.calls[0] as [string, string];
    expect(code).toMatch(/^\d{6}$/);
  });

  it('accepts a 10-character phone number', async () => {
    const req = createPostRequest('/api/otp/send', { phone: '9876543210' });
    const res = await sendPost(req);

    expect(res.status).toBe(200);
  });

  it('accepts a 15-character phone number (max length)', async () => {
    // 15 chars exactly: 1 + 14 digits
    const req = createPostRequest('/api/otp/send', { phone: '123456789012345' });
    const res = await sendPost(req);

    expect(res.status).toBe(200);
  });

  it('returns 400 when phone is shorter than 10 characters', async () => {
    const req = createPostRequest('/api/otp/send', { phone: '12345' });
    const res = await sendPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when phone is longer than 15 characters', async () => {
    // 16 chars — exceeds max of 15
    const req = createPostRequest('/api/otp/send', { phone: '1234567890123456' });
    const res = await sendPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when phone is missing', async () => {
    const req = createPostRequest('/api/otp/send', {});
    const res = await sendPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when body is empty', async () => {
    const req = createPostRequest('/api/otp/send', null);
    const res = await sendPost(req);

    expect(res.status).toBe(400);
  });

  it('returns 500 when SMS provider throws', async () => {
    mockSendOtp.mockRejectedValue(new Error('Provider unavailable'));

    const req = createPostRequest('/api/otp/send', { phone: '+919876543210' });
    const res = await sendPost(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('Provider unavailable');
  });
});

// ---------------------------------------------------------------------------
// POST /api/otp/verify
// ---------------------------------------------------------------------------

describe('POST /api/otp/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: mock mode enabled
    mockIsMockSmsMode.mockReturnValue(true);
  });

  it('accepts the mock OTP code 123456 and returns success with sessionToken', async () => {
    const req = createPostRequest('/api/otp/verify', { phone: '+919876543210', code: '123456' });
    const res = await verifyPost(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sessionToken).toBeDefined();
    expect(typeof body.sessionToken).toBe('string');
    expect(body.sessionToken.length).toBeGreaterThan(0);
  });

  it('returns a hex sessionToken (64 chars from 32 random bytes)', async () => {
    const req = createPostRequest('/api/otp/verify', { code: '123456' });
    const res = await verifyPost(req);

    const body = await res.json();
    expect(body.sessionToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects a wrong OTP code in mock mode', async () => {
    const req = createPostRequest('/api/otp/verify', { phone: '+919876543210', code: '000000' });
    const res = await verifyPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toMatch(/invalid otp/i);
  });

  it('rejects code 999999 in mock mode', async () => {
    const req = createPostRequest('/api/otp/verify', { code: '999999' });
    const res = await verifyPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('works without phone field (phone is optional in schema)', async () => {
    const req = createPostRequest('/api/otp/verify', { code: '123456' });
    const res = await verifyPost(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('works with optional token field', async () => {
    const req = createPostRequest('/api/otp/verify', { code: '123456', token: 'some-token' });
    const res = await verifyPost(req);

    expect(res.status).toBe(200);
  });

  it('returns 400 when code is not 6 characters', async () => {
    const req = createPostRequest('/api/otp/verify', { code: '12345' });
    const res = await verifyPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when code is 7 characters (too long)', async () => {
    const req = createPostRequest('/api/otp/verify', { code: '1234567' });
    const res = await verifyPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when code is missing', async () => {
    const req = createPostRequest('/api/otp/verify', { phone: '+919876543210' });
    const res = await verifyPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 in live mode (live mode not implemented in this route)', async () => {
    mockIsMockSmsMode.mockReturnValue(false);

    const req = createPostRequest('/api/otp/verify', { code: '123456' });
    const res = await verifyPost(req);

    // Route throws ValidationError in live mode — must not succeed
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/otp/resend
// ---------------------------------------------------------------------------

describe('POST /api/otp/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendOtp.mockResolvedValue(undefined);
  });

  it('resends OTP and returns success with expiresIn', async () => {
    const req = createPostRequest('/api/otp/resend', { phone: '+919876543210' });
    const res = await resendPost(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.expiresIn).toBe(600);
  });

  it('calls sendOtp on the SMS provider with the given phone', async () => {
    const req = createPostRequest('/api/otp/resend', { phone: '+910000000000' });
    await resendPost(req);

    expect(mockSendOtp).toHaveBeenCalledWith('+910000000000', expect.any(String));
  });

  it('generates a fresh 6-digit numeric OTP code on resend', async () => {
    const req = createPostRequest('/api/otp/resend', { phone: '+919876543210' });
    await resendPost(req);

    const [, code] = mockSendOtp.mock.calls[0] as [string, string];
    expect(code).toMatch(/^\d{6}$/);
  });

  it('returns 400 when phone is shorter than 10 characters', async () => {
    const req = createPostRequest('/api/otp/resend', { phone: '98765' });
    const res = await resendPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when phone is longer than 15 characters', async () => {
    // 16 chars — exceeds max of 15
    const req = createPostRequest('/api/otp/resend', { phone: '1234567890123456' });
    const res = await resendPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when phone is missing', async () => {
    const req = createPostRequest('/api/otp/resend', {});
    const res = await resendPost(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 when SMS provider throws', async () => {
    mockSendOtp.mockRejectedValue(new Error('Rate limit exceeded'));

    const req = createPostRequest('/api/otp/resend', { phone: '+919876543210' });
    const res = await resendPost(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('Rate limit');
  });
});
