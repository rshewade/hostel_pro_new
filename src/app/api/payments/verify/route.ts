import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api/error-handler';
import { recordPayment } from '@/lib/services/payments';
import { getPaymentGateway } from '@/lib/services/razorpay';
import { z } from 'zod';

const verifySchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
  feeId: z.string().uuid(),
  amount: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = verifySchema.parse(await req.json());

    const gateway = getPaymentGateway();
    const valid = gateway.verifyPaymentSignature(body.orderId, body.paymentId, body.signature);

    if (!valid) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Invalid payment signature', status: 403 } },
        { status: 403 },
      );
    }

    const payment = await recordPayment({
      feeId: body.feeId,
      studentUserId: session.user.id,
      amount: body.amount,
      paymentMethod: 'CARD',
      transactionId: body.paymentId,
      gatewayReference: body.orderId,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
