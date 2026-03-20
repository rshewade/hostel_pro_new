// @vitest-environment node
/**
 * Unit tests for fee and payment API routes:
 *   GET   /api/fees                   — list fees / summary (multi-role)
 *   POST  /api/fees                   — create fee record (ACCOUNTS, TRUSTEE)
 *   POST  /api/payments               — create Razorpay order (STUDENT)
 *   POST  /api/payments/verify        — verify payment signature + record payment (any auth)
 *   POST  /api/payments/webhook       — Razorpay webhook (no auth, signature-protected)
 *
 * Auth and services are fully mocked — no real DB, Razorpay calls, or side effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

// --- module mocks ----------------------------------------------------------

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/lib/services/payments', () => ({
  listFees: vi.fn(),
  createFee: vi.fn(),
  getPaymentSummary: vi.fn(),
  recordPayment: vi.fn(),
}));

vi.mock('@/lib/services/razorpay', () => ({
  getPaymentGateway: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import route handlers AFTER mocks
import { GET as getFees, POST as postFee } from '../fees/route';
import { POST as postPayment } from '../payments/route';
import { POST as verifyPayment } from '../payments/verify/route';
import { POST as webhookPayment } from '../payments/webhook/route';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import {
  listFees,
  createFee,
  getPaymentSummary,
  recordPayment,
} from '@/lib/services/payments';
import { getPaymentGateway } from '@/lib/services/razorpay';

// ---------------------------------------------------------------------------

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockRequireRole = requireRole as ReturnType<typeof vi.fn>;
const mockListFees = listFees as ReturnType<typeof vi.fn>;
const mockCreateFee = createFee as ReturnType<typeof vi.fn>;
const mockGetPaymentSummary = getPaymentSummary as ReturnType<typeof vi.fn>;
const mockRecordPayment = recordPayment as ReturnType<typeof vi.fn>;
const mockGetPaymentGateway = getPaymentGateway as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------

function createRequest(url: string, options?: RequestInit): NextRequest {
  const req = new Request(`http://localhost${url}`, options) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function createJsonRequest(url: string, method: string, body: unknown): NextRequest {
  return createRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createTextRequest(url: string, method: string, body: string, headers?: Record<string, string>): NextRequest {
  const req = new Request(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'text/plain', ...headers },
    body,
  }) as unknown as NextRequest;
  const urlObj = new URL(`http://localhost${url}`);
  Object.defineProperty(req, 'nextUrl', { value: urlObj, configurable: true });
  return req;
}

function fakeSession(authUserId = 'auth-user-1') {
  return { user: { id: authUserId, email: 'user@example.com' } };
}

const VALID_STUDENT_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const VALID_FEE_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const fakeFee = {
  id: VALID_FEE_UUID,
  studentUserId: VALID_STUDENT_UUID,
  head: 'HOSTEL_FEE',
  name: 'Monthly Hostel Fee',
  description: 'April 2026',
  amount: '5000',
  dueDate: '2026-04-30',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeFeeList = {
  data: [fakeFee],
  total: 1,
  page: 1,
  limit: 20,
};

const fakeSummary = {
  totalDue: '5000',
  totalPaid: '3000',
  totalOverdue: '2000',
  fees: [fakeFee],
};

const fakeOrder = {
  id: 'order_test_123',
  amount: 500000,
  currency: 'INR',
};

const fakePayment = {
  id: 'pay-uuid-1',
  feeId: VALID_FEE_UUID,
  studentUserId: VALID_STUDENT_UUID,
  amount: '5000',
  paymentMethod: 'CARD',
  transactionId: 'pay_test_456',
  gatewayReference: 'order_test_123',
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock gateway object shared across tests
const mockGateway = {
  createOrder: vi.fn(),
  verifyPaymentSignature: vi.fn(),
  verifyWebhookSignature: vi.fn(),
  getKeyId: vi.fn(),
};

// ---------------------------------------------------------------------------
// GET /api/fees
// ---------------------------------------------------------------------------

describe('GET /api/fees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListFees.mockResolvedValue(fakeFeeList);
    mockGetPaymentSummary.mockResolvedValue(fakeSummary);
  });

  it('returns fee list for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-super-1'));
    mockRequireRole.mockResolvedValue({ role: 'SUPERINTENDENT', vertical: 'BOYS' });

    const req = createRequest('/api/fees');
    const res = await getFees(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('returns fee list for STUDENT role (scoped to own fees)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/fees');
    const res = await getFees(req);

    expect(res.status).toBe(200);
  });

  it('forces studentUserId to session id for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/fees?studentUserId=someone-else');
    await getFees(req);

    expect(mockListFees).toHaveBeenCalledWith(
      expect.objectContaining({ studentUserId: 'auth-student-1' }),
    );
  });

  it('returns summary when summary=true for STUDENT', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createRequest('/api/fees?summary=true');
    const res = await getFees(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalDue).toBeDefined();
    expect(mockGetPaymentSummary).toHaveBeenCalledWith('auth-student-1');
    expect(mockListFees).not.toHaveBeenCalled();
  });

  it('passes studentUserId to summary for staff role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-accounts-1'));
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createRequest(`/api/fees?summary=true&studentUserId=${VALID_STUDENT_UUID}`);
    await getFees(req);

    expect(mockGetPaymentSummary).toHaveBeenCalledWith(VALID_STUDENT_UUID);
  });

  it('passes status filter to listFees', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createRequest('/api/fees?status=PENDING');
    await getFees(req);

    expect(mockListFees).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' }),
    );
  });

  it('defaults to page=1 and limit=20', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createRequest('/api/fees');
    await getFees(req);

    expect(mockListFees).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('returns fee list for PARENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-parent-1'));
    mockRequireRole.mockResolvedValue({ role: 'PARENT', vertical: null });

    const req = createRequest('/api/fees');
    const res = await getFees(req);

    expect(res.status).toBe(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createRequest('/api/fees');
    const res = await getFees(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for disallowed role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError());

    const req = createRequest('/api/fees');
    const res = await getFees(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/fees
// ---------------------------------------------------------------------------

describe('POST /api/fees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFee.mockResolvedValue(fakeFee);
  });

  it('creates a fee and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-accounts-1'));
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'HOSTEL_FEE',
      name: 'Monthly Hostel Fee',
      amount: '5000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.head).toBe('HOSTEL_FEE');
    expect(body.amount).toBe('5000');
  });

  it('creates a fee with TRUSTEE role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-trustee-1'));
    mockRequireRole.mockResolvedValue({ role: 'TRUSTEE', vertical: null });

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'MESS_FEE',
      name: 'Mess Fee April',
      amount: '2000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(201);
  });

  it('creates a fee with optional description', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-accounts-1'));
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'LATE_FEE',
      name: 'Late Payment Fee',
      description: 'Charged for late payment in March',
      amount: '500',
      dueDate: '2026-04-15',
    });
    const res = await postFee(req);

    expect(res.status).toBe(201);
  });

  it('returns 400 when studentUserId is not a valid UUID', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: 'not-a-uuid',
      head: 'HOSTEL_FEE',
      name: 'Fee',
      amount: '5000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid fee head enum', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'INVALID_HEAD',
      name: 'Fee',
      amount: '5000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'ACCOUNTS', vertical: null });

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'HOSTEL_FEE',
      amount: '5000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 for STUDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'STUDENT' is not authorized."));

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'HOSTEL_FEE',
      name: 'Fee',
      amount: '5000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for SUPERINTENDENT role', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'SUPERINTENDENT' is not authorized."));

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'HOSTEL_FEE',
      name: 'Fee',
      amount: '5000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/fees', 'POST', {
      studentUserId: VALID_STUDENT_UUID,
      head: 'HOSTEL_FEE',
      name: 'Fee',
      amount: '5000',
      dueDate: '2026-04-30',
    });
    const res = await postFee(req);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments
// ---------------------------------------------------------------------------

describe('POST /api/payments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPaymentGateway.mockReturnValue({
      ...mockGateway,
      createOrder: vi.fn().mockResolvedValue(fakeOrder),
      getKeyId: vi.fn().mockReturnValue('rzp_test_key123'),
    });
  });

  it('creates a Razorpay order and returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/payments', 'POST', {
      feeId: VALID_FEE_UUID,
      amount: 5000,
    });
    const res = await postPayment(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.orderId).toBe('order_test_123');
    expect(body.amount).toBe(500000);
    expect(body.currency).toBe('INR');
    expect(body.keyId).toBe('rzp_test_key123');
  });

  it('calls gateway.createOrder with amount, currency, and feeId', async () => {
    const mockCreateOrder = vi.fn().mockResolvedValue(fakeOrder);
    mockGetPaymentGateway.mockReturnValue({
      createOrder: mockCreateOrder,
      getKeyId: vi.fn().mockReturnValue('rzp_test_key123'),
    });
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/payments', 'POST', {
      feeId: VALID_FEE_UUID,
      amount: 5000,
    });
    await postPayment(req);

    expect(mockCreateOrder).toHaveBeenCalledWith(5000, 'INR', VALID_FEE_UUID);
  });

  it('returns 400 when feeId is not a valid UUID', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/payments', 'POST', {
      feeId: 'not-a-uuid',
      amount: 5000,
    });
    const res = await postPayment(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when amount is not a positive number', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/payments', 'POST', {
      feeId: VALID_FEE_UUID,
      amount: -100,
    });
    const res = await postPayment(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockResolvedValue({ role: 'STUDENT', vertical: null });

    const req = createJsonRequest('/api/payments', 'POST', {
      feeId: VALID_FEE_UUID,
    });
    const res = await postPayment(req);

    expect(res.status).toBe(400);
  });

  it('returns 403 for SUPERINTENDENT role (student-only endpoint)', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());
    mockRequireRole.mockRejectedValue(new ForbiddenError("Role 'SUPERINTENDENT' is not authorized."));

    const req = createJsonRequest('/api/payments', 'POST', {
      feeId: VALID_FEE_UUID,
      amount: 5000,
    });
    const res = await postPayment(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/payments', 'POST', {
      feeId: VALID_FEE_UUID,
      amount: 5000,
    });
    const res = await postPayment(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/verify
// ---------------------------------------------------------------------------

describe('POST /api/payments/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPaymentGateway.mockReturnValue({
      ...mockGateway,
      verifyPaymentSignature: vi.fn().mockReturnValue(true),
    });
    mockRecordPayment.mockResolvedValue(fakePayment);
  });

  it('verifies signature and records payment, returns 201', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'valid_signature',
      feeId: VALID_FEE_UUID,
      amount: '5000',
    });
    const res = await verifyPayment(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('COMPLETED');
  });

  it('calls verifyPaymentSignature with orderId, paymentId, and signature', async () => {
    const mockVerify = vi.fn().mockReturnValue(true);
    mockGetPaymentGateway.mockReturnValue({ verifyPaymentSignature: mockVerify });
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'valid_signature',
      feeId: VALID_FEE_UUID,
      amount: '5000',
    });
    await verifyPayment(req);

    expect(mockVerify).toHaveBeenCalledWith('order_test_123', 'pay_test_456', 'valid_signature');
  });

  it('calls recordPayment with session user id and payment details', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'valid_signature',
      feeId: VALID_FEE_UUID,
      amount: '5000',
    });
    await verifyPayment(req);

    expect(mockRecordPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        feeId: VALID_FEE_UUID,
        studentUserId: 'auth-student-1',
        amount: '5000',
        transactionId: 'pay_test_456',
        gatewayReference: 'order_test_123',
      }),
    );
  });

  it('returns 403 when signature is invalid', async () => {
    mockGetPaymentGateway.mockReturnValue({
      verifyPaymentSignature: vi.fn().mockReturnValue(false),
    });
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'invalid_signature',
      feeId: VALID_FEE_UUID,
      amount: '5000',
    });
    const res = await verifyPayment(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toContain('signature');
  });

  it('does not call recordPayment when signature fails', async () => {
    mockGetPaymentGateway.mockReturnValue({
      verifyPaymentSignature: vi.fn().mockReturnValue(false),
    });
    mockRequireAuth.mockResolvedValue(fakeSession('auth-student-1'));

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'bad_sig',
      feeId: VALID_FEE_UUID,
      amount: '5000',
    });
    await verifyPayment(req);

    expect(mockRecordPayment).not.toHaveBeenCalled();
  });

  it('returns 400 when feeId is not a valid UUID', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'valid_sig',
      feeId: 'not-a-uuid',
      amount: '5000',
    });
    const res = await verifyPayment(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when required fields are missing', async () => {
    mockRequireAuth.mockResolvedValue(fakeSession());

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      // missing paymentId, signature, feeId, amount
    });
    const res = await verifyPayment(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError());

    const req = createJsonRequest('/api/payments/verify', 'POST', {
      orderId: 'order_test_123',
      paymentId: 'pay_test_456',
      signature: 'sig',
      feeId: VALID_FEE_UUID,
      amount: '5000',
    });
    const res = await verifyPayment(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/webhook
// ---------------------------------------------------------------------------

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPaymentGateway.mockReturnValue({
      ...mockGateway,
      verifyWebhookSignature: vi.fn().mockReturnValue(true),
    });
  });

  it('returns 200 ok for a valid payment.captured event', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test_456' } } },
    });
    const req = createTextRequest('/api/payments/webhook', 'POST', body, {
      'x-razorpay-signature': 'valid_webhook_sig',
    });
    const res = await webhookPayment(req);

    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.status).toBe('ok');
  });

  it('returns 200 ok for a valid payment.failed event', async () => {
    const body = JSON.stringify({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'pay_test_789' } } },
    });
    const req = createTextRequest('/api/payments/webhook', 'POST', body, {
      'x-razorpay-signature': 'valid_webhook_sig',
    });
    const res = await webhookPayment(req);

    expect(res.status).toBe(200);
  });

  it('returns 200 ok for unknown event types', async () => {
    const body = JSON.stringify({ event: 'subscription.completed' });
    const req = createTextRequest('/api/payments/webhook', 'POST', body, {
      'x-razorpay-signature': 'valid_webhook_sig',
    });
    const res = await webhookPayment(req);

    expect(res.status).toBe(200);
  });

  it('returns 400 when webhook signature is invalid', async () => {
    mockGetPaymentGateway.mockReturnValue({
      verifyWebhookSignature: vi.fn().mockReturnValue(false),
    });

    const body = JSON.stringify({ event: 'payment.captured' });
    const req = createTextRequest('/api/payments/webhook', 'POST', body, {
      'x-razorpay-signature': 'bad_webhook_sig',
    });
    const res = await webhookPayment(req);

    expect(res.status).toBe(400);
    const resBody = await res.json();
    expect(resBody.error).toContain('signature');
  });

  it('treats missing x-razorpay-signature header as invalid', async () => {
    mockGetPaymentGateway.mockReturnValue({
      verifyWebhookSignature: vi.fn().mockReturnValue(false),
    });

    const body = JSON.stringify({ event: 'payment.captured' });
    const req = createTextRequest('/api/payments/webhook', 'POST', body);
    const res = await webhookPayment(req);

    expect(res.status).toBe(400);
  });

  it('calls verifyWebhookSignature with raw body text and signature header', async () => {
    const mockVerifyWebhook = vi.fn().mockReturnValue(true);
    mockGetPaymentGateway.mockReturnValue({ verifyWebhookSignature: mockVerifyWebhook });

    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const req = createTextRequest('/api/payments/webhook', 'POST', rawBody, {
      'x-razorpay-signature': 'webhook_sig_abc',
    });
    await webhookPayment(req);

    expect(mockVerifyWebhook).toHaveBeenCalledWith(rawBody, 'webhook_sig_abc');
  });

  it('returns 500 on unexpected processing error', async () => {
    mockGetPaymentGateway.mockImplementation(() => {
      throw new Error('Gateway initialization failed');
    });

    const body = JSON.stringify({ event: 'payment.captured' });
    const req = createTextRequest('/api/payments/webhook', 'POST', body, {
      'x-razorpay-signature': 'sig',
    });
    const res = await webhookPayment(req);

    expect(res.status).toBe(500);
    const resBody = await res.json();
    // Internal error message should not be leaked
    expect(resBody.error).not.toContain('Gateway initialization failed');
  });

  it('does not require any authentication headers', async () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    const req = createTextRequest('/api/payments/webhook', 'POST', body, {
      'x-razorpay-signature': 'valid_webhook_sig',
    });

    // Should succeed without any auth session
    const res = await webhookPayment(req);
    expect(res.status).toBe(200);
    // requireAuth was never set up — if route tried to use it, it would throw
    expect(mockRequireAuth).not.toHaveBeenCalled();
  });
});
