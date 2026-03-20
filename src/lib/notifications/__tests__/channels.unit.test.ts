import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock getSmsProvider so SmsChannel doesn't try to load real providers
vi.mock('@/lib/auth/otp-provider', () => ({
  getSmsProvider: vi.fn().mockReturnValue({
    sendOtp: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { SmsChannel } from '../channels/sms';
import { EmailChannel } from '../channels/email';
import { WhatsAppChannel } from '../channels/whatsapp';
import { logger } from '@/lib/logger';

beforeAll(() => {
  process.env.SIGNED_URL_SECRET = 'test-secret-key-for-signing-urls';
  process.env.SMS_MODE = 'mock';
  process.env.EMAIL_PROVIDER = 'console';
  process.env.WHATSAPP_MODE = 'mock';
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SmsChannel', () => {
  it('implements send method', () => {
    const channel = new SmsChannel();
    expect(typeof channel.send).toBe('function');
  });

  it('logs to console in mock mode (SMS_MODE != live)', async () => {
    process.env.SMS_MODE = 'mock';
    const channel = new SmsChannel();

    await channel.send('+919876543210', 'Your OTP is 1234');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[MOCK SMS]'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('+919876543210'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Your OTP is 1234'),
    );
  });

  it('does not throw in mock mode', async () => {
    process.env.SMS_MODE = 'mock';
    const channel = new SmsChannel();

    await expect(channel.send('+919876543210', 'Test')).resolves.toBeUndefined();
  });

  it('logs message content correctly', async () => {
    process.env.SMS_MODE = 'mock';
    const channel = new SmsChannel();

    await channel.send('+1234567890', 'Leave approved for Rahul');

    expect(logger.info).toHaveBeenCalledWith(
      '[MOCK SMS] To: +1234567890 Message: Leave approved for Rahul',
    );
  });
});

describe('EmailChannel', () => {
  it('implements send method', () => {
    const channel = new EmailChannel();
    expect(typeof channel.send).toBe('function');
  });

  it('logs to console when EMAIL_PROVIDER=console', async () => {
    process.env.EMAIL_PROVIDER = 'console';
    const channel = new EmailChannel();

    await channel.send('student@example.com', 'Your payment was received');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[MOCK EMAIL]'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('student@example.com'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Your payment was received'),
    );
  });

  it('uses default subject when metadata has no subject', async () => {
    process.env.EMAIL_PROVIDER = 'console';
    const channel = new EmailChannel();

    await channel.send('test@example.com', 'Body text');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Hostel Pro Notification'),
    );
  });

  it('uses custom subject from metadata', async () => {
    process.env.EMAIL_PROVIDER = 'console';
    const channel = new EmailChannel();

    await channel.send('test@example.com', 'Body text', { subject: 'Payment Confirmation' });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Payment Confirmation'),
    );
  });

  it('does not throw in console mode', async () => {
    process.env.EMAIL_PROVIDER = 'console';
    const channel = new EmailChannel();

    await expect(
      channel.send('test@example.com', 'Test message'),
    ).resolves.toBeUndefined();
  });

  it('falls back to console for unknown provider', async () => {
    process.env.EMAIL_PROVIDER = 'unknown-provider';
    const channel = new EmailChannel();

    await channel.send('test@example.com', 'Test');

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown email provider'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[EMAIL]'),
    );
  });
});

describe('WhatsAppChannel', () => {
  it('implements send method', () => {
    const channel = new WhatsAppChannel();
    expect(typeof channel.send).toBe('function');
  });

  it('logs to console in mock mode (WHATSAPP_MODE != live)', async () => {
    process.env.WHATSAPP_MODE = 'mock';
    const channel = new WhatsAppChannel();

    await channel.send('+919876543210', 'Your leave has been approved');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('[MOCK WHATSAPP]'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('+919876543210'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Your leave has been approved'),
    );
  });

  it('does not throw in mock mode', async () => {
    process.env.WHATSAPP_MODE = 'mock';
    const channel = new WhatsAppChannel();

    await expect(channel.send('+919876543210', 'Test')).resolves.toBeUndefined();
  });

  it('logs exact mock format', async () => {
    process.env.WHATSAPP_MODE = 'mock';
    const channel = new WhatsAppChannel();

    await channel.send('+1555123456', 'Fee payment reminder');

    expect(logger.info).toHaveBeenCalledWith(
      '[MOCK WHATSAPP] To: +1555123456 Message: Fee payment reminder',
    );
  });

  it('returns early without calling Twilio in mock mode', async () => {
    process.env.WHATSAPP_MODE = 'mock';
    const channel = new WhatsAppChannel();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await channel.send('+919876543210', 'Test message');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
