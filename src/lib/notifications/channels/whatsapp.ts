import { logger } from '@/lib/logger';
import type { NotificationChannel } from '../index';

export class WhatsAppChannel implements NotificationChannel {
  async send(to: string, message: string): Promise<void> {
    if (process.env.WHATSAPP_MODE !== 'live') {
      logger.info(`[MOCK WHATSAPP] To: ${to} Message: ${message}`);
      return;
    }

    // Twilio WhatsApp API (uses same credentials as SMS)
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const from = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `whatsapp:${to}`,
          From: from,
          Body: message,
        }),
      },
    );

    if (!response.ok) {
      logger.error('WhatsApp message failed', { to, status: response.status });
    }
  }
}
