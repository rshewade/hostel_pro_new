import { createHmac } from 'crypto';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Interface — shared by mock and live implementations
// ---------------------------------------------------------------------------
export interface PaymentGateway {
  createOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrder>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(body: string, signature: string): boolean;
  fetchPayment(paymentId: string): Promise<RazorpayPayment>;
  getKeyId(): string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
}

// ---------------------------------------------------------------------------
// Mock implementation (RAZORPAY_MODE=mock)
// ---------------------------------------------------------------------------
let _mockCounter = 0;

class MockPaymentGateway implements PaymentGateway {
  async createOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrder> {
    _mockCounter++;
    const order: RazorpayOrder = {
      id: `order_mock_${Date.now()}_${_mockCounter}`,
      amount: amount * 100, // paise
      currency,
      receipt,
      status: 'created',
    };
    logger.info(`[MOCK RAZORPAY] Order ${order.id} created for ₹${amount}`);
    return order;
  }

  verifyPaymentSignature(): boolean {
    logger.info('[MOCK RAZORPAY] Payment signature verified (mock always passes)');
    return true;
  }

  verifyWebhookSignature(): boolean {
    logger.info('[MOCK RAZORPAY] Webhook signature verified (mock always passes)');
    return true;
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    return {
      id: paymentId,
      orderId: `order_mock_${Date.now()}`,
      amount: 500000,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
    };
  }

  getKeyId(): string {
    return 'rzp_test_mock';
  }
}

// ---------------------------------------------------------------------------
// Live implementation (RAZORPAY_MODE=live)
// ---------------------------------------------------------------------------
class LivePaymentGateway implements PaymentGateway {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID!;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET!;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET.');
    }
  }

  async createOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrder> {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amount * 100, currency, receipt }),
    });

    if (!response.ok) throw new Error(`Razorpay createOrder failed: ${response.status}`);
    return response.json() as Promise<RazorpayOrder>;
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const expectedSignature = createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expectedSignature === signature;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`,
      },
    });
    if (!response.ok) throw new Error(`Razorpay fetchPayment failed: ${response.status}`);
    return response.json() as Promise<RazorpayPayment>;
  }

  getKeyId(): string {
    return this.keyId;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
let _gateway: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (!_gateway) {
    _gateway = process.env.RAZORPAY_MODE === 'live'
      ? new LivePaymentGateway()
      : new MockPaymentGateway();
  }
  return _gateway;
}
