import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export async function listNotifications(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(notifications)
      .where(eq(notifications.userId, userId)),
  ]);

  return { data, total, page, limit };
}

export async function markAsRead(notificationId: string, userId: string) {
  const [notif] = await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();
  if (!notif) throw new NotFoundError('Notification not found');
  return notif;
}

export async function markAllAsRead(userId: string) {
  await db.update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db.select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return result?.count ?? 0;
}
