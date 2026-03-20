import { logger } from '@/lib/logger';

export interface SmsProvider {
  sendOtp(phone: string, otp: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Mock SMS Provider (default — SMS_MODE=mock)
// ---------------------------------------------------------------------------
class MockSmsProvider implements SmsProvider {
  async sendOtp(phone: string, otp: string): Promise<void> {
    logger.info(`[MOCK SMS] OTP ${otp} sent to ${phone}`);
  }
}

// ---------------------------------------------------------------------------
// Twilio SMS Provider (SMS_MODE=live)
// ---------------------------------------------------------------------------
class TwilioProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
    this.authToken = process.env.TWILIO_AUTH_TOKEN!;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER!;

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.');
    }
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: phone,
      From: this.fromNumber,
      Body: `Your Hostel Pro verification code is: ${otp}. Valid for 10 minutes.`,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Twilio SMS failed', { phone, error });
      throw new Error(`Failed to send OTP via Twilio: ${response.status}`);
    }

    logger.info(`[TWILIO] OTP sent to ${phone}`);
  }
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------
let _provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (!_provider) {
    _provider = process.env.SMS_MODE === 'live'
      ? new TwilioProvider()
      : new MockSmsProvider();
  }
  return _provider;
}

/** Mock OTP code — used in mock mode for verification */
export const MOCK_OTP_CODE = '123456';

/** Check if running in mock mode */
export function isMockSmsMode(): boolean {
  return process.env.SMS_MODE !== 'live';
}
