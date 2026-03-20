import { logger } from '@/lib/logger';
import type { NotificationChannel } from '../index';

export class EmailChannel implements NotificationChannel {
  async send(to: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    const subject = (metadata?.subject as string) ?? 'Hostel Pro Notification';
    const provider = process.env.EMAIL_PROVIDER ?? 'console';

    if (provider === 'console') {
      logger.info(`[MOCK EMAIL] To: ${to} Subject: ${subject} Body: ${message}`);
      return;
    }

    if (provider === 'resend') {
      await this.sendViaResend(to, subject, message);
    } else if (provider === 'sendgrid') {
      await this.sendViaSendGrid(to, subject, message);
    } else {
      logger.warn(`Unknown email provider: ${provider}, falling back to console`);
      logger.info(`[EMAIL] To: ${to} Subject: ${subject} Body: ${message}`);
    }
  }

  private async sendViaResend(to: string, subject: string, body: string) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'noreply@hostelpro.local',
        to,
        subject,
        text: body,
      }),
    });
    if (!response.ok) {
      logger.error('Resend email failed', { status: response.status, to });
    }
  }

  private async sendViaSendGrid(to: string, subject: string, body: string) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.EMAIL_FROM ?? 'noreply@hostelpro.local' },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
    });
    if (!response.ok) {
      logger.error('SendGrid email failed', { status: response.status, to });
    }
  }
}
