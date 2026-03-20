import { db } from '@/lib/db';
import { notificationRules } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { renderTemplate } from './template';
import { SmsChannel } from './channels/sms';
import { EmailChannel } from './channels/email';
import { WhatsAppChannel } from './channels/whatsapp';
import { InAppChannel } from './channels/in-app';
import { logger } from '@/lib/logger';

export interface NotificationChannel {
  send(to: string, message: string, metadata?: Record<string, unknown>): Promise<void>;
}

const smsChannel = new SmsChannel();
const emailChannel = new EmailChannel();
const whatsAppChannel = new WhatsAppChannel();
const inAppChannel = new InAppChannel();

interface NotifyParams {
  event: string;
  context: Record<string, string>;
  recipients: {
    userId?: string;
    phone?: string;
    email?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Dispatch notifications to all enabled channels based on notification_rules.
 */
export async function notify(params: NotifyParams): Promise<void> {
  const { event, context, recipients, metadata } = params;

  // Fetch active rules for this event
  const rules = await db.select().from(notificationRules)
    .where(and(eq(notificationRules.eventType, event), eq(notificationRules.isActive, true)));

  if (rules.length === 0) {
    logger.debug(`No notification rules for event: ${event}`);
    // Still send in-app notification even without rules
    if (recipients.userId) {
      await inAppChannel.send(recipients.userId, context.message ?? event, {
        ...metadata,
        title: context.title ?? event,
        type: 'SYSTEM',
      });
    }
    return;
  }

  for (const rule of rules) {
    const message = renderTemplate(rule.template, context);
    const channels = rule.channels as { sms?: boolean; email?: boolean; whatsapp?: boolean } ?? {};

    const promises: Promise<void>[] = [];

    if (channels.sms && recipients.phone) {
      promises.push(smsChannel.send(recipients.phone, message).catch((err) => {
        logger.error('SMS notification failed', { event, err });
      }));
    }

    if (channels.email && recipients.email) {
      promises.push(emailChannel.send(recipients.email, message, {
        subject: context.title ?? `Hostel Pro: ${event}`,
        ...metadata,
      }).catch((err) => {
        logger.error('Email notification failed', { event, err });
      }));
    }

    if (channels.whatsapp && recipients.phone) {
      promises.push(whatsAppChannel.send(recipients.phone, message).catch((err) => {
        logger.error('WhatsApp notification failed', { event, err });
      }));
    }

    // In-app always fires
    if (recipients.userId) {
      promises.push(inAppChannel.send(recipients.userId, message, {
        title: context.title ?? event,
        type: metadata?.notificationType ?? 'SYSTEM',
        entityType: metadata?.entityType,
        entityId: metadata?.entityId,
        actionUrl: metadata?.actionUrl,
      }));
    }

    await Promise.all(promises);
  }

  logger.info(`Notifications dispatched for event: ${event}`, { rules: rules.length });
}
