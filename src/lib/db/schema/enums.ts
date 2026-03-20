import { pgEnum } from 'drizzle-orm/pg-core';

// User & Role
export const userRoleEnum = pgEnum('user_role', [
  'STUDENT', 'SUPERINTENDENT', 'TRUSTEE', 'ACCOUNTS', 'PARENT',
]);

export const verticalTypeEnum = pgEnum('vertical_type', [
  'BOYS', 'GIRLS', 'DHARAMSHALA', 'BOYS_HOSTEL', 'GIRLS_ASHRAM',
]);

export const genderTypeEnum = pgEnum('gender_type', ['Male', 'Female', 'Other']);

// Application
export const applicationStatusEnum = pgEnum('application_status', [
  'DRAFT', 'SUBMITTED', 'REVIEW', 'INTERVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED',
]);

export const applicationTypeEnum = pgEnum('application_type', ['NEW', 'RENEWAL']);

// Document
export const documentStatusEnum = pgEnum('document_status', [
  'UPLOADED', 'VERIFIED', 'REJECTED',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'PHOTOGRAPH', 'AADHAAR_CARD', 'BIRTH_CERTIFICATE', 'EDUCATION_CERTIFICATE',
  'INCOME_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'POLICE_VERIFICATION',
  'UNDERTAKING', 'RECEIPT', 'LEAVE_APPLICATION', 'RENEWAL_FORM', 'OTHER',
]);

// Room
export const roomStatusEnum = pgEnum('room_status', [
  'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED',
]);

export const allocationStatusEnum = pgEnum('allocation_status', [
  'ACTIVE', 'CHECKED_OUT', 'TRANSFERRED', 'CANCELLED',
]);

// Fee & Payment
export const feeHeadEnum = pgEnum('fee_head', [
  'PROCESSING_FEE', 'SECURITY_DEPOSIT', 'HOSTEL_FEE', 'MESS_FEE',
  'MAINTENANCE_FEE', 'ELECTRICITY_FEE', 'LAUNDRY_FEE', 'LATE_FEE',
  'DAMAGE_CHARGE', 'OTHER',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING', 'PAID', 'OVERDUE', 'WAIVED', 'REFUNDED', 'CANCELLED',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'DEMAND_DRAFT', 'CARD', 'OTHER',
]);

// Leave
export const leaveTypeEnum = pgEnum('leave_type', [
  'HOME_VISIT', 'SHORT_LEAVE', 'MEDICAL', 'EMERGENCY', 'OTHER',
]);

export const leaveStatusEnum = pgEnum('leave_status', [
  'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED',
]);

// Interview
export const interviewModeEnum = pgEnum('interview_mode', [
  'ONLINE', 'IN_PERSON', 'PHONE',
]);

export const interviewStatusEnum = pgEnum('interview_status', [
  'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED',
]);

// Notification & Communication
export const notificationTypeEnum = pgEnum('notification_type', [
  'FEE_REMINDER', 'FEE_OVERDUE', 'LEAVE_APPROVED', 'LEAVE_REJECTED',
  'LEAVE_PENDING', 'RENEWAL_REMINDER', 'APPLICATION_UPDATE',
  'INTERVIEW_SCHEDULED', 'ROOM_ALLOCATION', 'ANNOUNCEMENT', 'SYSTEM', 'OTHER',
]);

export const communicationTypeEnum = pgEnum('communication_type', [
  'SMS', 'EMAIL', 'WHATSAPP', 'PUSH',
]);

export const communicationStatusEnum = pgEnum('communication_status', [
  'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED',
]);

// Exit & Clearance
export const exitRequestStatusEnum = pgEnum('exit_request_status', [
  'PENDING', 'APPROVED', 'CLEARANCE_PENDING', 'CLEARANCE_COMPLETE',
  'DEPOSIT_REFUND_PENDING', 'COMPLETED', 'CANCELLED',
]);

export const clearanceStatusEnum = pgEnum('clearance_status', [
  'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED',
]);

export const clearanceItemStatusEnum = pgEnum('clearance_item_status', [
  'PENDING', 'CLEARED', 'BLOCKED', 'NOT_APPLICABLE',
]);

// Student
export const studentStatusEnum = pgEnum('student_status', [
  'PENDING', 'CHECKED_IN', 'ON_LEAVE', 'SUSPENDED', 'ALUMNI', 'WITHDRAWN',
]);

export const renewalStatusEnum = pgEnum('renewal_status', [
  'NOT_DUE', 'PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED',
]);
