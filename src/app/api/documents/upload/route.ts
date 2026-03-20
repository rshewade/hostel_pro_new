import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { validateFile, generateStoragePath, uploadDocument } from '@/lib/services/documents';
import { upload } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const applicationId = formData.get('applicationId') as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'file and documentType are required', status: 400 } },
        { status: 400 },
      );
    }

    validateFile({ size: file.size, type: file.type });

    const storagePath = generateStoragePath(session.user.id, applicationId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await upload(storagePath, buffer);

    const doc = await uploadDocument({
      studentUserId: session.user.id,
      applicationId: applicationId ?? undefined,
      documentType: documentType as 'PHOTOGRAPH' | 'AADHAAR_CARD' | 'OTHER',
      bucketId: 'local',
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: session.user.id,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
