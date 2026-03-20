import { NextRequest, NextResponse } from 'next/server';
import { verifySignedUrl } from '@/lib/storage/signed-urls';
import { download } from '@/lib/storage';
import { lookup } from 'mime-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join('/');

  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const expires = searchParams.get('expires');

  if (!token || !expires) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing signed URL token', status: 401 } },
      { status: 401 },
    );
  }

  if (!verifySignedUrl(filePath, token, expires)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Invalid or expired signed URL', status: 403 } },
      { status: 403 },
    );
  }

  try {
    const data = await download(filePath);
    const contentType = lookup(filePath) || 'application/octet-stream';

    return new NextResponse(Buffer.from(data), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'File not found', status: 404 } },
      { status: 404 },
    );
  }
}
