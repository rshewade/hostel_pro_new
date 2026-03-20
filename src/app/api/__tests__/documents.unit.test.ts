/**
 * Unit tests for document API routes:
 *   GET  /api/documents                   — list documents (multi-role)
 *   POST /api/documents/upload            — upload a document (any auth role)
 *   GET  /api/documents/[id]/url          — get signed URL for a document
 *   GET  /api/student/documents           — student's own document list
 *   POST /api/student/documents           — student upload (STUDENT role only)
 *
 * Auth, services, and storage are fully mocked — no real DB or FS is touched.
 * FormData upload tests mock req.formData() directly to avoid jsdom limitations.
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';

// --- module mocks ----------------------------------------------------------

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/lib/services/documents', () => ({
  listDocuments: vi.fn(),
  validateFile: vi.fn(),
  generateStoragePath: vi.fn(),
  uploadDocument: vi.fn(),
  getDocumentById: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  upload: vi.fn(),
}));

vi.mock('@/lib/storage/signed-urls', () => ({
  generateSignedUrl: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import route handlers AFTER mocks
import { GET as getDocuments } from '../documents/route';
import { POST as uploadDocument } from '../documents/upload/route';
import { GET as getDocumentUrl } from '../documents/[id]/url/route';
import { GET as getStudentDocuments, POST as postStudentDocument } from '../student/documents/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import {
  listDocuments,
  validateFile,
  generateStoragePath,
  uploadDocument as uploadDocumentService,
  getDocumentById,
} from '@/lib/services/documents';
import { upload } from '@/lib/storage';
import { generateSignedUrl } from '@/lib/storage/signed-urls';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockListDocuments = listDocuments as ReturnType<typeof vi.fn>;
const mockValidateFile = validateFile as ReturnType<typeof vi.fn>;
const mockGenerateStoragePath = generateStoragePath as ReturnType<typeof vi.fn>;
const mockUploadDocumentService = uploadDocumentService as ReturnType<typeof vi.fn>;
const mockGetDocumentById = getDocumentById as ReturnType<typeof vi.fn>;
const mockUpload = upload as ReturnType<typeof vi.fn>;
const mockGenerateSignedUrl = generateSignedUrl as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret';
});

function createRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(`http://localhost${url}`, options) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function fakeSession(authUserId = 'auth-user-1') {
  return { user: { id: authUserId, email: 'user@example.com' } };
}

/**
 * Build a NextRequest whose formData() method returns a controlled FormData.
 * This avoids jsdom limitations with FormData + File deserialization.
 */
function createUploadRequest(
  url: string,
  fields: { file?: File | null; documentType?: string | null; applicationId?: string | null },
): NextRequest {
  const req = new Request(`http://localhost${url}`, { method: 'POST' }) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });

  // Build a real FormData and override req.formData() to return it
  const fd = new FormData();
  if (fields.file != null) fd.append('file', fields.file);
  if (fields.documentType != null) fd.append('documentType', fields.documentType);
  if (fields.applicationId != null) fd.append('applicationId', fields.applicationId);

  Object.defineProperty(req, 'formData', {
    value: () => Promise.resolve(fd),
    configurable: true,
  });

  return req;
}

const fakeDocument = {
  id: 'doc-uuid-1',
  studentUserId: 'auth-user-1',
  applicationId: 'app-uuid-1',
  documentType: 'AADHAAR_CARD',
  status: 'PENDING',
  storagePath: 'auth-user-1/app-uuid-1/1234567890_aadhar.pdf',
  fileName: 'aadhar.pdf',
  fileSize: 204800,
  mimeType: 'application/pdf',
  bucketId: 'local',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeDocumentList = {
  data: [fakeDocument],
  total: 1,
  page: 1,
  limit: 20,
};

// ---------------------------------------------------------------------------
// GET /api/documents
// ---------------------------------------------------------------------------

describe('GET /api/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListDocuments.mockResolvedValue(fakeDocumentList);
  });

  it('returns document list for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/documents');
    const res = await getDocuments(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('returns document list for TRUSTEE role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/documents');
    const res = await getDocuments(req);

    expect(res.status).toBe(200);
  });

  it('returns document list for ACCOUNTS role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createRequest('/api/documents');
    const res = await getDocuments(req);

    expect(res.status).toBe(200);
  });

  it('forces studentUserId to the session user id for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockListDocuments.mockResolvedValue({ ...fakeDocumentList, data: [] });

    const req = createRequest('/api/documents?studentUserId=someone-else');
    await getDocuments(req);

    const callArgs = mockListDocuments.mock.calls[0][0];
    expect(callArgs.studentUserId).toBe('student-auth-id');
  });

  it('passes applicationId filter to listDocuments', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/documents?applicationId=app-uuid-1');
    await getDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'app-uuid-1' }),
    );
  });

  it('passes status filter to listDocuments', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/documents?status=VERIFIED');
    await getDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'VERIFIED' }),
    );
  });

  it('passes documentType filter to listDocuments', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/documents?documentType=PHOTOGRAPH');
    await getDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: 'PHOTOGRAPH' }),
    );
  });

  it('supports pagination parameters', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/documents?page=3&limit=10');
    await getDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, limit: 10 }),
    );
  });

  it('defaults to page=1 and limit=20 when not provided', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/documents');
    await getDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/documents');
    const res = await getDocuments(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when role is not allowed', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError());

    const req = createRequest('/api/documents');
    const res = await getDocuments(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/documents/upload
// ---------------------------------------------------------------------------

describe('POST /api/documents/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateStoragePath.mockReturnValue('auth-user-1/general/1234567890_doc.pdf');
    mockUpload.mockResolvedValue(undefined);
    mockUploadDocumentService.mockResolvedValue(fakeDocument);
  });

  it('uploads document with valid file and documentType and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const file = new File(['content'], 'aadhar.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/documents/upload', { file, documentType: 'AADHAAR_CARD' });

    const res = await uploadDocument(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('doc-uuid-1');
    expect(body.documentType).toBe('AADHAAR_CARD');
  });

  it('calls validateFile before uploading', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const req = createUploadRequest('/api/documents/upload', { file, documentType: 'PHOTOGRAPH' });

    await uploadDocument(req);

    expect(mockValidateFile).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/jpeg' }),
    );
  });

  it('calls upload storage with the generated path', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockGenerateStoragePath.mockReturnValue('auth-user-1/general/ts_doc.pdf');

    const file = new File(['binary-content'], 'doc.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/documents/upload', { file, documentType: 'OTHER' });

    await uploadDocument(req);

    expect(mockUpload).toHaveBeenCalledWith('auth-user-1/general/ts_doc.pdf', expect.any(Buffer));
  });

  it('saves the document record with correct studentUserId and mimeType', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-user-1'));

    const file = new File(['data'], 'aadhar.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/documents/upload', {
      file,
      documentType: 'AADHAAR_CARD',
      applicationId: 'app-uuid-1',
    });

    await uploadDocument(req);

    expect(mockUploadDocumentService).toHaveBeenCalledWith(
      expect.objectContaining({
        studentUserId: 'auth-user-1',
        applicationId: 'app-uuid-1',
        documentType: 'AADHAAR_CARD',
        mimeType: 'application/pdf',
        uploadedBy: 'auth-user-1',
      }),
    );
  });

  it('returns 400 when file is missing from form data', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createUploadRequest('/api/documents/upload', { documentType: 'AADHAAR_CARD' });

    const res = await uploadDocument(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when documentType is missing from form data', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/documents/upload', { file });

    const res = await uploadDocument(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when file type is not allowed (text/html)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockValidateFile.mockImplementation(() => {
      throw new ValidationError("File type 'text/html' not allowed.");
    });

    const file = new File(['<html>bad</html>'], 'xss.html', { type: 'text/html' });
    const req = createUploadRequest('/api/documents/upload', { file, documentType: 'OTHER' });

    const res = await uploadDocument(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('not allowed');
  });

  it('returns 400 when file exceeds size limit', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockValidateFile.mockImplementation(() => {
      throw new ValidationError('File size exceeds 10MB limit');
    });

    const file = new File(['x'.repeat(100)], 'huge.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/documents/upload', { file, documentType: 'AADHAAR_CARD' });

    const res = await uploadDocument(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('size exceeds');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/documents/upload', { file, documentType: 'AADHAAR_CARD' });

    const res = await uploadDocument(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('does not call upload storage if validateFile throws', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockValidateFile.mockImplementation(() => {
      throw new ValidationError('Bad file type');
    });

    const file = new File(['data'], 'bad.exe', { type: 'application/x-msdownload' });
    const req = createUploadRequest('/api/documents/upload', { file, documentType: 'OTHER' });

    await uploadDocument(req);

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockUploadDocumentService).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/documents/[id]/url
// ---------------------------------------------------------------------------

describe('GET /api/documents/[id]/url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocumentById.mockResolvedValue(fakeDocument);
    mockGenerateSignedUrl.mockReturnValue({
      url: '/api/storage/path/to/doc.pdf?token=abc&expires=9999999999',
      token: 'abc',
      expiresAt: 9999999999,
    });
  });

  it('returns signed URL and expiresAt for a valid document id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest('/api/documents/doc-uuid-1/url');
    const res = await getDocumentUrl(req, { params: Promise.resolve({ id: 'doc-uuid-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBeDefined();
    expect(body.expiresAt).toBeDefined();
  });

  it('calls getDocumentById with the path param id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest('/api/documents/doc-uuid-1/url');
    await getDocumentUrl(req, { params: Promise.resolve({ id: 'doc-uuid-1' }) });

    expect(mockGetDocumentById).toHaveBeenCalledWith('doc-uuid-1');
  });

  it('calls generateSignedUrl with the document storagePath', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createRequest('/api/documents/doc-uuid-1/url');
    await getDocumentUrl(req, { params: Promise.resolve({ id: 'doc-uuid-1' }) });

    expect(mockGenerateSignedUrl).toHaveBeenCalledWith(fakeDocument.storagePath);
  });

  it('returns 404 when document does not exist', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockGetDocumentById.mockRejectedValue(new NotFoundError('Document not found'));

    const req = createRequest('/api/documents/nonexistent-id/url');
    const res = await getDocumentUrl(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/documents/doc-uuid-1/url');
    const res = await getDocumentUrl(req, { params: Promise.resolve({ id: 'doc-uuid-1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/student/documents
// ---------------------------------------------------------------------------

describe('GET /api/student/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListDocuments.mockResolvedValue(fakeDocumentList);
  });

  it('returns student-own documents for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/student/documents');
    const res = await getStudentDocuments(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  it('always scopes query to the session user id', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/student/documents');
    await getStudentDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'student-auth-id' }),
    );
  });

  it('passes status filter to listDocuments', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/student/documents?status=VERIFIED');
    await getStudentDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'VERIFIED' }),
    );
  });

  it('passes documentType filter to listDocuments', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/student/documents?documentType=PHOTOGRAPH');
    await getStudentDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: 'PHOTOGRAPH' }),
    );
  });

  it('supports pagination parameters', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/student/documents?page=2&limit=5');
    await getStudentDocuments(req);

    expect(mockListDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
    );
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/student/documents');
    const res = await getStudentDocuments(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for non-STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError());

    const req = createRequest('/api/student/documents');
    const res = await getStudentDocuments(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/student/documents
// ---------------------------------------------------------------------------

describe('POST /api/student/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateStoragePath.mockReturnValue('student-auth-id/general/ts_doc.pdf');
    mockUpload.mockResolvedValue(undefined);
    mockUploadDocumentService.mockResolvedValue(fakeDocument);
  });

  it('uploads document and returns 201 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const file = new File(['pdf-bytes'], 'aadhar.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/student/documents', { file, documentType: 'AADHAAR_CARD' });

    const res = await postStudentDocument(req);

    expect(res.status).toBe(201);
  });

  it('scopes upload to session user id automatically', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('student-auth-id'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const req = createUploadRequest('/api/student/documents', { file, documentType: 'PHOTOGRAPH' });

    await postStudentDocument(req);

    expect(mockUploadDocumentService).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'student-auth-id' }),
    );
  });

  it('returns 400 when file is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createUploadRequest('/api/student/documents', { documentType: 'AADHAAR_CARD' });
    const res = await postStudentDocument(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when documentType is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/student/documents', { file });
    const res = await postStudentDocument(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for disallowed file type', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });
    mockValidateFile.mockImplementation(() => {
      throw new ValidationError("File type 'text/html' not allowed.");
    });

    const file = new File(['<html></html>'], 'bad.html', { type: 'text/html' });
    const req = createUploadRequest('/api/student/documents', { file, documentType: 'OTHER' });

    const res = await postStudentDocument(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 for SUPERINTENDENT attempting to use student upload route', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'SUPERINTENDENT' is not authorized."));

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/student/documents', { file, documentType: 'AADHAAR_CARD' });

    const res = await postStudentDocument(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for PARENT attempting to use student upload route', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'PARENT' is not authorized."));

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/student/documents', { file, documentType: 'AADHAAR_CARD' });

    const res = await postStudentDocument(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const req = createUploadRequest('/api/student/documents', { file, documentType: 'AADHAAR_CARD' });

    const res = await postStudentDocument(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
