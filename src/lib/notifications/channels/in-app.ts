import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import type { NotificationChannel } from '../index';

export class InAppChannel implements NotificationChannel {
  async send(to: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    // `to` is the userId for in-app notifications
    await db.insert(notifications).values({
      userId: to,
      type: (metadata?.type as typeof notifications.$inferInsert.type) ?? 'SYSTEM',
      title: (metadata?.title as string) ?? 'Notification',
      message,
      relatedEntityType: metadata?.entityType as string,
      relatedEntityId: metadata?.entityId as string,
      actionUrl: metadata?.actionUrl as string,
      metadata: metadata ?? {},
    });
  }
}
