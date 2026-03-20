import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { createHmac } from 'crypto';

type DocInsert = typeof documents.$inferInsert;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(file: { size: number; type: string }) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError(`File type '${file.type}' not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }
}

export function generateStoragePath(userId: string, applicationId: string | null, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const folder = applicationId ?? 'general';
  return `${userId}/${folder}/${timestamp}_${sanitized}`;
}

export function generateSignedUrl(path: string, expiresInSeconds = 3600): { url: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const token = createHmac('sha256', process.env.SIGNED_URL_SECRET!)
    .update(`${path}:${expiresAt.getTime()}`)
    .digest('hex');
  const url = `/api/storage/${path}?token=${token}&expires=${expiresAt.getTime()}`;
  return { url, expiresAt };
}

export async function uploadDocument(data: Omit<DocInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const [doc] = await db.insert(documents).values(data).returning();
  return doc;
}

export async function getDocumentById(id: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

export async function listDocuments(filters: {
  applicationId?: string;
  studentUserId?: string;
  status?: string;
  documentType?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20 } = filters;
  const conditions = [];

  if (filters.applicationId) conditions.push(eq(documents.applicationId, filters.applicationId));
  if (filters.studentUserId) conditions.push(eq(documents.studentUserId, filters.studentUserId));
  if (filters.status) conditions.push(sql`${documents.status} = ${filters.status}`);
  if (filters.documentType) conditions.push(sql`${documents.documentType} = ${filters.documentType}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(documents).where(where).orderBy(desc(documents.createdAt)).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(documents).where(where),
  ]);

  return { data, total, page, limit };
}

export async function verifyDocument(id: string, status: 'VERIFIED' | 'REJECTED', verifiedBy: string, rejectionReason?: string) {
  const [doc] = await db.update(documents)
    .set({
      status,
      verifiedAt: new Date(),
      verifiedBy,
      ...(status === 'REJECTED' && rejectionReason ? { metadata: { rejectionReason } } : {}),
    })
    .where(eq(documents.id, id))
    .returning();
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

export async function deleteDocument(id: string) {
  const doc = await getDocumentById(id);
  // Delete file from local storage
  const fs = await import('fs/promises');
  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  try {
    await fs.unlink(`${uploadDir}/${doc.storagePath}`);
  } catch {
    // File may already be deleted
  }
  await db.delete(documents).where(eq(documents.id, id));
}
