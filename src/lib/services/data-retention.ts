import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { lt, and, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const ARCHIVE_AFTER_DAYS = 365; // Archive applications older than 1 year

export async function runDataRetention() {
  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - ARCHIVE_AFTER_DAYS);

  // Archive old completed/rejected applications
  const archived = await db.update(applications)
    .set({ currentStatus: 'ARCHIVED' })
    .where(and(
      lt(applications.updatedAt, archiveDate),
      sql`${applications.currentStatus} IN ('APPROVED', 'REJECTED')`,
    ))
    .returning({ id: applications.id });

  logger.info(`Data retention: archived ${archived.length} applications`);

  return {
    archivedApplications: archived.length,
  };
}

export async function getRetentionStats() {
  const archiveDate = new Date();
  archiveDate.setDate(archiveDate.getDate() - ARCHIVE_AFTER_DAYS);

  const [result] = await db.select({
    pendingArchive: sql<number>`COUNT(*) FILTER (WHERE ${applications.updatedAt} < ${archiveDate} AND ${applications.currentStatus} IN ('APPROVED', 'REJECTED'))`,
  }).from(applications);

  return {
    pendingArchive: result?.pendingArchive ?? 0,
  };
}
