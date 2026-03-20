/**
 * Unit tests for GET /api/storage/[...path]
 *
 * The storage route verifies a signed URL token and serves files from local FS.
 * We mock `verifySignedUrl` and `download` to isolate route logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

const { mockVerifySignedUrl, mockDownload } = vi.hoisted(() => ({
  mockVerifySignedUrl: vi.fn(),
  mockDownload: vi.fn(),
}));

vi.mock('@/lib/storage/signed-urls', () => ({
  verifySignedUrl: mockVerifySignedUrl,
}));

vi.mock('@/lib/storage', () => ({
  download: mockDownload,
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

import { GET } from '../storage/[...path]/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a NextRequest that simulates a call to /api/storage/<path>?token=<t>&expires=<e>
 * and construct the `params` Promise that the route handler receives.
 */
function createStorageRequest(
  pathSegments: string[],
  query: { token?: string; expires?: string } = {},
): { req: NextRequest; params: Promise<{ path: string[] }> } {
  const qs = new URLSearchParams();
  if (query.token !== undefined) qs.set('token', query.token);
  if (query.expires !== undefined) qs.set('expires', query.expires);

  const url = `http://localhost/api/storage/${pathSegments.join('/')}?${qs.toString()}`;
  const req = new NextRequest(new URL(url));
  const params = Promise.resolve({ path: pathSegments });
  return { req, params };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/storage/[...path]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Happy path — file served
  // -------------------------------------------------------------------------

  it('returns the file with the correct content type for a PDF', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])); // %PDF

    const { req, params } = createStorageRequest(
      ['documents', 'aadhar.pdf'],
      { token: 'valid-token', expires: String(Math.floor(Date.now() / 1000) + 3600) },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('returns the file with the correct content type for a JPEG image', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff]));

    const { req, params } = createStorageRequest(
      ['photos', 'profile.jpg'],
      { token: 'valid-token', expires: String(Math.floor(Date.now() / 1000) + 3600) },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('sets Content-Disposition with the file name', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockResolvedValue(new Uint8Array([1, 2, 3]));

    const { req, params } = createStorageRequest(
      ['docs', 'fee-receipt.pdf'],
      { token: 'tok', expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });

    expect(res.headers.get('Content-Disposition')).toContain('fee-receipt.pdf');
  });

  it('sets Cache-Control: private, max-age=3600', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockResolvedValue(new Uint8Array([1]));

    const { req, params } = createStorageRequest(
      ['docs', 'sample.pdf'],
      { token: 'tok', expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });

    expect(res.headers.get('Cache-Control')).toBe('private, max-age=3600');
  });

  it('calls verifySignedUrl with the joined file path, token, and expires', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockResolvedValue(new Uint8Array([0]));

    const expires = String(Math.floor(Date.now() / 1000) + 3600);
    const { req, params } = createStorageRequest(
      ['documents', 'student', 'id-card.pdf'],
      { token: 'my-token', expires },
    );

    await GET(req, { params });

    expect(mockVerifySignedUrl).toHaveBeenCalledWith(
      'documents/student/id-card.pdf',
      'my-token',
      expires,
    );
  });

  it('calls download with the joined file path', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockResolvedValue(new Uint8Array([0]));

    const { req, params } = createStorageRequest(
      ['uploads', 'test.txt'],
      { token: 't', expires: String(Math.floor(Date.now() / 1000) + 3600) },
    );

    await GET(req, { params });

    expect(mockDownload).toHaveBeenCalledWith('uploads/test.txt');
  });

  it('falls back to application/octet-stream for unknown file types', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockResolvedValue(new Uint8Array([0]));

    // .hostelbin is not a real MIME type and will not be resolved by mime-types
    const { req, params } = createStorageRequest(
      ['data', 'file.hostelbin'],
      { token: 'tok', expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
  });

  // -------------------------------------------------------------------------
  // Missing token or expires
  // -------------------------------------------------------------------------

  it('returns 401 when token query param is missing', async () => {
    const { req, params } = createStorageRequest(
      ['docs', 'report.pdf'],
      { expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toMatch(/missing signed url token/i);
    expect(mockVerifySignedUrl).not.toHaveBeenCalled();
  });

  it('returns 401 when expires query param is missing', async () => {
    const { req, params } = createStorageRequest(
      ['docs', 'report.pdf'],
      { token: 'some-token' },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(mockVerifySignedUrl).not.toHaveBeenCalled();
  });

  it('returns 401 when both token and expires are missing', async () => {
    const { req, params } = createStorageRequest(['docs', 'report.pdf'], {});

    const res = await GET(req, { params });

    expect(res.status).toBe(401);
    expect(mockVerifySignedUrl).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Invalid / expired token
  // -------------------------------------------------------------------------

  it('returns 403 when verifySignedUrl returns false (invalid token)', async () => {
    mockVerifySignedUrl.mockReturnValue(false);

    const { req, params } = createStorageRequest(
      ['docs', 'secret.pdf'],
      { token: 'bad-token', expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toMatch(/invalid or expired signed url/i);
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('returns 403 when the signed URL has expired (verifySignedUrl returns false)', async () => {
    mockVerifySignedUrl.mockReturnValue(false);

    const expiredTime = String(Math.floor(Date.now() / 1000) - 3600);
    const { req, params } = createStorageRequest(
      ['docs', 'old.pdf'],
      { token: 'expired-token', expires: expiredTime },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  // -------------------------------------------------------------------------
  // File not found
  // -------------------------------------------------------------------------

  it('returns 404 when the file does not exist in storage', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockRejectedValue(new Error('File not found: docs/missing.pdf'));

    const { req, params } = createStorageRequest(
      ['docs', 'missing.pdf'],
      { token: 'valid-token', expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toMatch(/file not found/i);
  });

  it('returns 404 for a deeply nested path when file is missing', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockRejectedValue(new Error('File not found'));

    const { req, params } = createStorageRequest(
      ['a', 'b', 'c', 'deep.png'],
      { token: 'tok', expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });

    expect(res.status).toBe(404);
  });

  it('does not leak download error details to the client', async () => {
    mockVerifySignedUrl.mockReturnValue(true);
    mockDownload.mockRejectedValue(new Error('ENOENT: no such file /internal/path/secret.txt'));

    const { req, params } = createStorageRequest(
      ['docs', 'anything.pdf'],
      { token: 'tok', expires: String(Math.floor(Date.now() / 1000) + 600) },
    );

    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(JSON.stringify(body)).not.toContain('ENOENT');
    expect(JSON.stringify(body)).not.toContain('/internal/path');
  });
});
