import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getDocumentById } from '@/lib/services/documents';
import { generateSignedUrl } from '@/lib/storage/signed-urls';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const doc = await getDocumentById(id);
    const signed = generateSignedUrl(doc.storagePath);
    return NextResponse.json({ url: signed.url, expiresAt: signed.expiresAt });
  } catch (err) {
    return handleApiError(err);
  }
}
