import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateReceiptNumber } from './payments';

interface ReceiptData {
  studentName: string;
  studentId: string;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  feeBreakdown: { name: string; amount: number }[];
  totalAmount: number;
  receiptNumber: string;
}

export async function generateReceipt(data: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  let y = height - 50;

  // Header
  page.drawText('Hostel Pro', { x: 50, y, font: fontBold, size: 20, color: rgb(0.1, 0.1, 0.4) });
  y -= 20;
  page.drawText('Student Accommodation Management', { x: 50, y, font, size: 10, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;

  // Receipt title
  page.drawText('PAYMENT RECEIPT', { x: 50, y, font: fontBold, size: 14 });
  page.drawText(`Receipt #: ${data.receiptNumber}`, { x: 350, y, font, size: 10 });
  y -= 30;

  // Student details
  const details = [
    ['Student Name', data.studentName],
    ['Student ID', data.studentId],
    ['Payment Date', data.paymentDate],
    ['Payment Method', data.paymentMethod],
    ['Transaction ID', data.transactionId || 'N/A'],
  ];

  for (const [label, value] of details) {
    page.drawText(`${label}:`, { x: 50, y, font: fontBold, size: 10 });
    page.drawText(value, { x: 180, y, font, size: 10 });
    y -= 18;
  }

  y -= 20;

  // Fee breakdown header
  page.drawText('Fee Description', { x: 50, y, font: fontBold, size: 10 });
  page.drawText('Amount (INR)', { x: 400, y, font: fontBold, size: 10 });
  y -= 5;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 });
  y -= 15;

  // Fee rows
  for (const item of data.feeBreakdown) {
    page.drawText(item.name, { x: 50, y, font, size: 10 });
    page.drawText(`₹${item.amount.toLocaleString('en-IN')}`, { x: 400, y, font, size: 10 });
    y -= 18;
  }

  // Total
  y -= 5;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 });
  y -= 18;
  page.drawText('Total Amount', { x: 50, y, font: fontBold, size: 12 });
  page.drawText(`₹${data.totalAmount.toLocaleString('en-IN')}`, { x: 400, y, font: fontBold, size: 12 });

  // Footer
  y = 80;
  page.drawText('This is a computer-generated receipt and does not require a signature.', {
    x: 50, y, font, size: 8, color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(`Generated: ${new Date().toISOString()}`, {
    x: 50, y: y - 15, font, size: 8, color: rgb(0.5, 0.5, 0.5),
  });

  return pdf.save();
}

export async function generateAndStoreReceipt(
  receiptData: Omit<ReceiptData, 'receiptNumber'>,
  studentUserId: string,
): Promise<{ receiptNumber: string; filePath: string }> {
  const receiptNumber = await generateReceiptNumber();
  const pdfBytes = await generateReceipt({ ...receiptData, receiptNumber });

  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  const filePath = `system-generated/receipts/${studentUserId}/${receiptNumber}.pdf`;
  const fullPath = `${uploadDir}/${filePath}`;

  const fs = await import('fs/promises');
  const path = await import('path');
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, pdfBytes);

  return { receiptNumber, filePath };
}
