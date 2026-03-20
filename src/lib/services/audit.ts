import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

type AuditInsert = typeof auditLogs.$inferInsert;

export async function createAuditLog(data: Omit<AuditInsert, 'id' | 'createdAt'>) {
  try {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  } catch (err) {
    logger.error('Failed to create audit log', err);
    return null;
  }
}

export async function logAuth(action: string, metadata: Record<string, unknown> & {
  phone?: string;
  ip?: string;
  userAgent?: string;
  actorId?: string;
  success?: boolean;
}) {
  return createAuditLog({
    entityType: 'AUTH',
    action,
    actorId: metadata.actorId,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
    metadata: {
      phone: metadata.phone,
      success: metadata.success,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function logEntityChange(
  entityType: string,
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  actorId: string,
  metadata?: Record<string, unknown>,
) {
  return createAuditLog({
    entityType,
    entityId,
    action,
    actorId,
    metadata: metadata ?? {},
  });
}

export async function getAuditLogsByActor(actorId: string, limit = 100) {
  return db.select().from(auditLogs)
    .where(eq(auditLogs.actorId, actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getAuditLogsByEntity(entityType: string, entityId: string, limit = 100) {
  return db.select().from(auditLogs)
    .where(eq(auditLogs.entityId, entityId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
