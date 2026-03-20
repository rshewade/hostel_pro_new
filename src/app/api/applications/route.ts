import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { createApplication, listApplications } from '@/lib/services/applications';
import { z } from 'zod';

const createSchema = z.object({
  applicantName: z.string().min(1),
  applicantMobile: z.string().min(10),
  applicantEmail: z.string().email().optional(),
  dateOfBirth: z.string(),
  gender: z.string(),
  vertical: z.enum(['BOYS', 'GIRLS', 'DHARAMSHALA', 'BOYS_HOSTEL', 'GIRLS_ASHRAM']),
  type: z.enum(['NEW', 'RENEWAL']).default('NEW'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role, vertical } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS']);
    const { searchParams } = req.nextUrl;

    const data = await listApplications({
      userId: session.user.id,
      userRole: role,
      userVertical: vertical,
      status: searchParams.get('status') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1'),
      limit: parseInt(searchParams.get('limit') ?? '20'),
    });
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = createSchema.parse(await req.json());
    const app = await createApplication({ ...body, studentUserId: session.user.id });
    return NextResponse.json(app, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
