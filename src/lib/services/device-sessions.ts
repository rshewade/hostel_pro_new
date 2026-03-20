import { db } from '@/lib/db';
import { deviceSessions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export async function upsertDeviceSession(data: {
  userId: string;
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const [existing] = await db.select().from(deviceSessions)
    .where(and(eq(deviceSessions.userId, data.userId), eq(deviceSessions.deviceId, data.deviceId)));

  if (existing) {
    const [updated] = await db.update(deviceSessions)
      .set({
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceName: data.deviceName,
        lastUsedAt: new Date(),
        isActive: true,
      })
      .where(eq(deviceSessions.id, existing.id))
      .returning();
    return updated;
  }

  const [session] = await db.insert(deviceSessions).values({
    userId: data.userId,
    deviceId: data.deviceId,
    deviceName: data.deviceName,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  }).returning();
  return session;
}

export async function getUserSessions(userId: string) {
  return db.select().from(deviceSessions)
    .where(and(eq(deviceSessions.userId, userId), eq(deviceSessions.isActive, true)))
    .orderBy(desc(deviceSessions.lastUsedAt));
}

export async function deactivateSession(sessionId: string, userId: string) {
  const [session] = await db.update(deviceSessions)
    .set({ isActive: false })
    .where(and(eq(deviceSessions.id, sessionId), eq(deviceSessions.userId, userId)))
    .returning();
  if (!session) throw new NotFoundError('Session not found');
  return session;
}

export async function deactivateAllSessions(userId: string, _exceptDeviceId?: string) {
  const conditions = [eq(deviceSessions.userId, userId), eq(deviceSessions.isActive, true)];

  await db.update(deviceSessions)
    .set({ isActive: false })
    .where(and(...conditions));
}
