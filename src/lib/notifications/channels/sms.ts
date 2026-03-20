import { logger } from '@/lib/logger';
import { getSmsProvider } from '@/lib/auth/otp-provider';
import type { NotificationChannel } from '../index';

export class SmsChannel implements NotificationChannel {
  async send(to: string, message: string): Promise<void> {
    // Reuse the SMS provider from auth (same Twilio/mock config)
    if (process.env.SMS_MODE === 'live') {
      const provider = getSmsProvider();
      await provider.sendOtp(to, message); // reusing sendOtp for general SMS
    } else {
      logger.info(`[MOCK SMS] To: ${to} Message: ${message}`);
    }
  }
}
