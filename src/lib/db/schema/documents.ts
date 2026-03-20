import { pgTable, uuid, text, bigint, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { documentStatusEnum, documentTypeEnum } from './enums';
import { applications } from './applications';
import { users } from './users';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }),
  studentUserId: uuid('student_user_id').references(() => users.id, { onDelete: 'cascade' }),
  documentType: documentTypeEnum('document_type').notNull(),
  bucketId: text('bucket_id').notNull(),
  storagePath: text('storage_path').notNull(),
  storageUrl: text('storage_url'),
  fileName: text('file_name').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  mimeType: text('mime_type'),
  status: documentStatusEnum('status').notNull().default('UPLOADED'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  metadata: jsonb('metadata').default({}),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_documents_application_id').on(table.applicationId),
  index('idx_documents_student_user_id').on(table.studentUserId),
  index('idx_documents_document_type').on(table.documentType),
  index('idx_documents_status').on(table.status),
]);
