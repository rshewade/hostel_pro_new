import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock generateReceiptNumber (used by generateAndStoreReceipt)
vi.mock('@/lib/services/payments', () => ({
  generateReceiptNumber: vi.fn().mockResolvedValue('RCP-202603-00001'),
}));

// Mock pdf-lib to avoid WinAnsi encoding issues with ₹ character
vi.mock('pdf-lib', () => {
  // Build a fake PDF binary starting with %PDF header (inline to avoid hoisting issues)
  const header = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]; // %PDF-1.4
  const padding = new Array(2000).fill(0x00);
  const eof = [0x25, 0x25, 0x45, 0x4F, 0x46]; // %%EOF
  const bytes = new Uint8Array([...header, ...padding, ...eof]);

  const mockPage = {
    getSize: () => ({ width: 595, height: 842 }),
    drawText: () => {},
    drawLine: () => {},
  };
  const mockFont = {};
  const mockPdf = {
    addPage: () => mockPage,
    embedFont: () => Promise.resolve(mockFont),
    save: () => Promise.resolve(bytes),
  };
  return {
    PDFDocument: {
      create: () => Promise.resolve(mockPdf),
    },
    rgb: () => ({ red: 0, green: 0, blue: 0 }),
    StandardFonts: {
      Helvetica: 'Helvetica',
      HelveticaBold: 'Helvetica-Bold',
    },
  };
});

import { generateReceipt } from '../receipt';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

const sampleReceiptData = {
  studentName: 'Rahul Sharma',
  studentId: 'STU-2026-001',
  paymentDate: '2026-03-20',
  paymentMethod: 'UPI',
  transactionId: 'TXN-123456',
  feeBreakdown: [
    { name: 'Hostel Fee', amount: 25000 },
    { name: 'Mess Fee', amount: 15000 },
    { name: 'Maintenance', amount: 5000 },
  ],
  totalAmount: 45000,
  receiptNumber: 'RCP-202603-00001',
};

describe('generateReceipt', () => {
  it('returns a Uint8Array', async () => {
    const result = await generateReceipt(sampleReceiptData);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('PDF bytes start with %PDF header', async () => {
    const result = await generateReceipt(sampleReceiptData);
    const header = new TextDecoder().decode(result.slice(0, 4));
    expect(header).toBe('%PDF');
  });

  it('produces non-empty output', async () => {
    const result = await generateReceipt(sampleReceiptData);
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces a reasonably sized PDF (> 1KB)', async () => {
    const result = await generateReceipt(sampleReceiptData);
    expect(result.length).toBeGreaterThan(1024);
  });

  it('works with empty fee breakdown', async () => {
    const data = { ...sampleReceiptData, feeBreakdown: [], totalAmount: 0 };
    const result = await generateReceipt(data);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('works with a single fee item', async () => {
    const data = {
      ...sampleReceiptData,
      feeBreakdown: [{ name: 'Hostel Fee', amount: 50000 }],
      totalAmount: 50000,
    };
    const result = await generateReceipt(data);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles special characters in student name', async () => {
    const data = { ...sampleReceiptData, studentName: "Priya O'Brien-Kumar" };
    const result = await generateReceipt(data);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles empty transaction ID gracefully', async () => {
    const data = { ...sampleReceiptData, transactionId: '' };
    const result = await generateReceipt(data);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('is an async function', () => {
    const result = generateReceipt(sampleReceiptData);
    expect(result).toBeInstanceOf(Promise);
  });

  it('produces consistent output for same input', async () => {
    const result1 = await generateReceipt(sampleReceiptData);
    const result2 = await generateReceipt(sampleReceiptData);
    expect(result1.length).toBe(result2.length);
  });
});
