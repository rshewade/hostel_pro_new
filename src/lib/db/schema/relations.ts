import { relations } from 'drizzle-orm';
import { users } from './users';
import { students } from './students';
import { applications } from './applications';
import { documents } from './documents';
import { rooms, roomAllocations } from './rooms';
import { fees, payments } from './fees';
import { leaveRequests } from './leaves';
import { renewals } from './renewals';
import { interviews } from './interviews';
import { auditLogs } from './audit';
import { deviceSessions } from './devices';
import { notifications, communications } from './notifications';
import { exitRequests, clearances, clearanceItems } from './exits';
import { consentLogs } from './compliance';

// Users
export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  applications: many(applications),
  documents: many(documents),
  roomAllocations: many(roomAllocations),
  fees: many(fees),
  payments: many(payments),
  leaveRequests: many(leaveRequests),
  renewals: many(renewals),
  deviceSessions: many(deviceSessions),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  exitRequests: many(exitRequests),
  consentLogs: many(consentLogs),
}));

// Students
export const studentsRelations = relations(students, ({ one }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
}));

// Applications
export const applicationsRelations = relations(applications, ({ one, many }) => ({
  studentUser: one(users, { fields: [applications.studentUserId], references: [users.id] }),
  approver: one(users, { fields: [applications.approvedBy], references: [users.id], relationName: 'approver' }),
  rejecter: one(users, { fields: [applications.rejectedBy], references: [users.id], relationName: 'rejecter' }),
  parentApplication: one(applications, { fields: [applications.parentApplicationId], references: [applications.id], relationName: 'parentChild' }),
  documents: many(documents),
  interviews: many(interviews),
  renewals: many(renewals),
  fees: many(fees),
}));

// Documents
export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, { fields: [documents.applicationId], references: [applications.id] }),
  studentUser: one(users, { fields: [documents.studentUserId], references: [users.id], relationName: 'studentDocuments' }),
  verifier: one(users, { fields: [documents.verifiedBy], references: [users.id], relationName: 'verifier' }),
  uploader: one(users, { fields: [documents.uploadedBy], references: [users.id], relationName: 'uploader' }),
}));

// Rooms
export const roomsRelations = relations(rooms, ({ many }) => ({
  allocations: many(roomAllocations),
}));

export const roomAllocationsRelations = relations(roomAllocations, ({ one }) => ({
  student: one(users, { fields: [roomAllocations.studentUserId], references: [users.id] }),
  room: one(rooms, { fields: [roomAllocations.roomId], references: [rooms.id] }),
  allocator: one(users, { fields: [roomAllocations.allocatedBy], references: [users.id], relationName: 'allocator' }),
}));

// Fees & Payments
export const feesRelations = relations(fees, ({ one, many }) => ({
  student: one(users, { fields: [fees.studentUserId], references: [users.id] }),
  application: one(applications, { fields: [fees.applicationId], references: [applications.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  fee: one(fees, { fields: [payments.feeId], references: [fees.id] }),
  student: one(users, { fields: [payments.studentUserId], references: [users.id] }),
  verifier: one(users, { fields: [payments.verifiedBy], references: [users.id], relationName: 'paymentVerifier' }),
}));

// Leave Requests
export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  student: one(users, { fields: [leaveRequests.studentUserId], references: [users.id] }),
  approver: one(users, { fields: [leaveRequests.approvedBy], references: [users.id], relationName: 'leaveApprover' }),
  rejecter: one(users, { fields: [leaveRequests.rejectedBy], references: [users.id], relationName: 'leaveRejecter' }),
}));

// Renewals
export const renewalsRelations = relations(renewals, ({ one }) => ({
  student: one(users, { fields: [renewals.studentUserId], references: [users.id] }),
  application: one(applications, { fields: [renewals.applicationId], references: [applications.id] }),
  approver: one(users, { fields: [renewals.approvedBy], references: [users.id], relationName: 'renewalApprover' }),
}));

// Interviews
export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, { fields: [interviews.applicationId], references: [applications.id] }),
  superintendent: one(users, { fields: [interviews.superintendentId], references: [users.id], relationName: 'interviewSuper' }),
  trustee: one(users, { fields: [interviews.trusteeId], references: [users.id], relationName: 'interviewTrustee' }),
}));

// Audit Logs
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));

// Device Sessions
export const deviceSessionsRelations = relations(deviceSessions, ({ one }) => ({
  user: one(users, { fields: [deviceSessions.userId], references: [users.id] }),
}));

// Notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  recipient: one(users, { fields: [communications.recipientId], references: [users.id] }),
}));

// Exit Requests & Clearances
export const exitRequestsRelations = relations(exitRequests, ({ one, many }) => ({
  student: one(users, { fields: [exitRequests.studentUserId], references: [users.id] }),
  approver: one(users, { fields: [exitRequests.approvedBy], references: [users.id], relationName: 'exitApprover' }),
  clearances: many(clearances),
}));

export const clearancesRelations = relations(clearances, ({ one, many }) => ({
  exitRequest: one(exitRequests, { fields: [clearances.exitRequestId], references: [exitRequests.id] }),
  student: one(users, { fields: [clearances.studentUserId], references: [users.id] }),
  items: many(clearanceItems),
}));

export const clearanceItemsRelations = relations(clearanceItems, ({ one }) => ({
  clearance: one(clearances, { fields: [clearanceItems.clearanceId], references: [clearances.id] }),
  clearer: one(users, { fields: [clearanceItems.clearedBy], references: [users.id] }),
}));

// Consent Logs
export const consentLogsRelations = relations(consentLogs, ({ one }) => ({
  user: one(users, { fields: [consentLogs.userId], references: [users.id] }),
  application: one(applications, { fields: [consentLogs.applicationId], references: [applications.id] }),
}));
