import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getDocumentById } from '@/lib/services/documents';
import { generateSignedUrl } from '@/lib/storage/signed-urls';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);
    const { id } = await params;

    const doc = await getDocumentById(id);

    // Ensure student can only access their own documents
    if (doc.studentUserId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only access your own documents', status: 403 } },
        { status: 403 },
      );
    }

    const signed = generateSignedUrl(doc.storagePath);
    return NextResponse.json({ url: signed.url, expiresAt: signed.expiresAt });
  } catch (err) {
    return handleApiError(err);
  }
}
