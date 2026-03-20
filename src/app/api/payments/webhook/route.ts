import { NextRequest, NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/services/razorpay';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';

    const gateway = getPaymentGateway();
    const valid = gateway.verifyWebhookSignature(body, signature);

    if (!valid) {
      logger.warn('Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    logger.info('Razorpay webhook received', { event: event.event });

    // Process webhook events
    switch (event.event) {
      case 'payment.captured':
        logger.info('Payment captured', { paymentId: event.payload?.payment?.entity?.id });
        break;
      case 'payment.failed':
        logger.warn('Payment failed', { paymentId: event.payload?.payment?.entity?.id });
        break;
      default:
        logger.debug('Unhandled webhook event', { event: event.event });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    logger.error('Webhook processing error', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
