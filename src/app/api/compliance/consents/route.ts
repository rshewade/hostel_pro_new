import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { createConsentLog, getConsentsByUser } from '@/lib/services/consent';
import { z } from 'zod';

const consentSchema = z.object({
  consentType: z.string().min(1),
  consentVersion: z.string().min(1),
  digitalSignature: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await getConsentsByUser(session.user.id);
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = consentSchema.parse(await req.json());
    const log = await createConsentLog({
      userId: session.user.id,
      ...body,
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
