import { db } from '@/lib/db';
import { consentLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function createConsentLog(data: {
  userId?: string;
  applicationId?: string;
  consentType: string;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
  digitalSignature?: string;
}) {
  const [log] = await db.insert(consentLogs).values(data).returning();
  return log;
}

export async function getConsentsByUser(userId: string) {
  return db.select().from(consentLogs)
    .where(eq(consentLogs.userId, userId))
    .orderBy(desc(consentLogs.createdAt));
}

export async function hasConsent(userId: string, consentType: string, consentVersion: string): Promise<boolean> {
  const [log] = await db.select({ id: consentLogs.id }).from(consentLogs)
    .where(and(
      eq(consentLogs.userId, userId),
      eq(consentLogs.consentType, consentType),
      eq(consentLogs.consentVersion, consentVersion),
    ));
  return !!log;
}
