import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { createFee, listFees, getPaymentSummary } from '@/lib/services/payments';
import { z } from 'zod';

const createFeeSchema = z.object({
  studentUserId: z.string().uuid(),
  head: z.enum(['PROCESSING_FEE', 'SECURITY_DEPOSIT', 'HOSTEL_FEE', 'MESS_FEE', 'MAINTENANCE_FEE', 'ELECTRICITY_FEE', 'LAUNDRY_FEE', 'LATE_FEE', 'DAMAGE_CHARGE', 'OTHER']),
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.string(),
  dueDate: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { role } = await requireRole(session, ['STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS', 'PARENT']);
    const { searchParams } = req.nextUrl;

    if (searchParams.get('summary') === 'true') {
      const studentId = role === 'STUDENT' ? session.user.id : searchParams.get('studentUserId')!;
      const summary = await getPaymentSummary(studentId);
      return NextResponse.json(summary);
    }

    const data = await listFees({
      studentUserId: role === 'STUDENT' ? session.user.id : searchParams.get('studentUserId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
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
    await requireRole(session, ['ACCOUNTS', 'TRUSTEE']);
    const body = createFeeSchema.parse(await req.json());
    const fee = await createFee(body);
    return NextResponse.json(fee, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
