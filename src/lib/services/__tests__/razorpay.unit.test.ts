import { describe, it, expect, beforeAll } from 'vitest';
import { getPaymentGateway } from '../razorpay';

beforeAll(() => {
  process.env.RAZORPAY_MODE = 'mock';
});

describe('RazorpayService (mock mode)', () => {
  const gateway = getPaymentGateway();

  describe('createOrder', () => {
    it('creates a mock order', async () => {
      const order = await gateway.createOrder(5000, 'INR', 'test-receipt');
      expect(order.id).toMatch(/^order_mock_/);
      expect(order.amount).toBe(500000); // paise
      expect(order.currency).toBe('INR');
      expect(order.receipt).toBe('test-receipt');
      expect(order.status).toBe('created');
    });

    it('generates unique order IDs', async () => {
      const a = await gateway.createOrder(100, 'INR', 'r1');
      const b = await gateway.createOrder(100, 'INR', 'r2');
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('verifyPaymentSignature', () => {
    it('always returns true in mock mode', () => {
      expect(gateway.verifyPaymentSignature('order_1', 'pay_1', 'sig_1')).toBe(true);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('always returns true in mock mode', () => {
      expect(gateway.verifyWebhookSignature('body', 'sig')).toBe(true);
    });
  });

  describe('fetchPayment', () => {
    it('returns a mock payment', async () => {
      const payment = await gateway.fetchPayment('pay_test_123');
      expect(payment.id).toBe('pay_test_123');
      expect(payment.status).toBe('captured');
      expect(payment.currency).toBe('INR');
    });
  });

  describe('getKeyId', () => {
    it('returns mock key ID', () => {
      expect(gateway.getKeyId()).toBe('rzp_test_mock');
    });
  });
});
