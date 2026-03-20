import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { getPaymentGateway } from '@/lib/services/razorpay';
import { z } from 'zod';

const createOrderSchema = z.object({
  feeId: z.string().uuid(),
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole(session, ['STUDENT']);
    const body = createOrderSchema.parse(await req.json());

    const gateway = getPaymentGateway();
    const order = await gateway.createOrder(body.amount, 'INR', body.feeId);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: gateway.getKeyId(),
    }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
