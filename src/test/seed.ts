/**
 * Seed database with realistic test data.
 * Run: DATABASE_URL=... bun run src/test/seed.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  users, students, rooms, roomAllocations, applications, documents,
  fees, payments, leaveRequests, interviews, interviewSlots,
  notifications, communications, notificationRules, leaveTypes,
  blackoutDates, consentLogs, auditLogs,
} from '../lib/db/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function seed() {
  console.log('Seeding database...');

  // ------------------------------------------------------------------
  // 1. Rooms (12 rooms across 3 verticals)
  // ------------------------------------------------------------------
  const roomData = [
    { roomNumber: 'A-101', vertical: 'BOYS' as const, block: 'A', floor: 1, capacity: 3 },
    { roomNumber: 'A-102', vertical: 'BOYS' as const, block: 'A', floor: 1, capacity: 3 },
    { roomNumber: 'A-201', vertical: 'BOYS' as const, block: 'A', floor: 2, capacity: 2 },
    { roomNumber: 'A-202', vertical: 'BOYS' as const, block: 'A', floor: 2, capacity: 2 },
    { roomNumber: 'B-101', vertical: 'GIRLS' as const, block: 'B', floor: 1, capacity: 2 },
    { roomNumber: 'B-102', vertical: 'GIRLS' as const, block: 'B', floor: 1, capacity: 2 },
    { roomNumber: 'B-201', vertical: 'GIRLS' as const, block: 'B', floor: 2, capacity: 3 },
    { roomNumber: 'B-202', vertical: 'GIRLS' as const, block: 'B', floor: 2, capacity: 3 },
    { roomNumber: 'C-101', vertical: 'DHARAMSHALA' as const, block: 'C', floor: 1, capacity: 4 },
    { roomNumber: 'C-102', vertical: 'DHARAMSHALA' as const, block: 'C', floor: 1, capacity: 4 },
    { roomNumber: 'C-201', vertical: 'DHARAMSHALA' as const, block: 'C', floor: 2, capacity: 2 },
    { roomNumber: 'C-202', vertical: 'DHARAMSHALA' as const, block: 'C', floor: 2, capacity: 2 },
  ];
  const insertedRooms = await db.insert(rooms).values(roomData).onConflictDoNothing().returning();
  console.log(`  Rooms: ${insertedRooms.length} created`);

  // ------------------------------------------------------------------
  // 2. Applications (6 applications in various states)
  // ------------------------------------------------------------------
  const appData = [
    { trackingNumber: 'BH-2026-0001', type: 'NEW' as const, applicantName: 'Rahul Kumar', applicantMobile: '+919876543210', dateOfBirth: '2005-03-15', gender: 'Male', vertical: 'BOYS' as const, currentStatus: 'APPROVED' as const, submittedAt: new Date('2026-01-15') },
    { trackingNumber: 'BH-2026-0002', type: 'NEW' as const, applicantName: 'Amit Sharma', applicantMobile: '+919876543220', dateOfBirth: '2004-07-22', gender: 'Male', vertical: 'BOYS' as const, currentStatus: 'SUBMITTED' as const, submittedAt: new Date('2026-03-01') },
    { trackingNumber: 'GA-2026-0001', type: 'NEW' as const, applicantName: 'Priya Jain', applicantMobile: '+919876543230', dateOfBirth: '2005-11-08', gender: 'Female', vertical: 'GIRLS' as const, currentStatus: 'INTERVIEW' as const, submittedAt: new Date('2026-02-20') },
    { trackingNumber: 'GA-2026-0002', type: 'NEW' as const, applicantName: 'Neha Gupta', applicantMobile: '+919876543240', dateOfBirth: '2006-01-30', gender: 'Female', vertical: 'GIRLS' as const, currentStatus: 'DRAFT' as const },
    { trackingNumber: 'DH-2026-0001', type: 'NEW' as const, applicantName: 'Mohan Lal', applicantMobile: '+919876543250', dateOfBirth: '1960-05-12', gender: 'Male', vertical: 'DHARAMSHALA' as const, currentStatus: 'APPROVED' as const, submittedAt: new Date('2026-01-10') },
    { trackingNumber: 'BH-2026-0003', type: 'RENEWAL' as const, applicantName: 'Rahul Kumar', applicantMobile: '+919876543210', dateOfBirth: '2005-03-15', gender: 'Male', vertical: 'BOYS' as const, currentStatus: 'SUBMITTED' as const, submittedAt: new Date('2026-03-15') },
  ];
  const insertedApps = await db.insert(applications).values(appData).onConflictDoNothing().returning();
  console.log(`  Applications: ${insertedApps.length} created`);

  // ------------------------------------------------------------------
  // 3. Get existing users (seeded via Better Auth earlier)
  // ------------------------------------------------------------------
  const existingUsers = await db.select().from(users);
  const studentUser = existingUsers.find(u => u.role === 'STUDENT');
  const superUser = existingUsers.find(u => u.role === 'SUPERINTENDENT');

  if (studentUser) {
    // ------------------------------------------------------------------
    // 4. Fees for the student
    // ------------------------------------------------------------------
    const feeData = [
      { studentUserId: studentUser.id, head: 'HOSTEL_FEE' as const, name: 'Hostel Fee - Semester 1', amount: '15000', dueDate: '2026-04-15', status: 'PENDING' as const },
      { studentUserId: studentUser.id, head: 'MESS_FEE' as const, name: 'Mess Fee - March 2026', amount: '3500', dueDate: '2026-03-31', status: 'PENDING' as const },
      { studentUserId: studentUser.id, head: 'SECURITY_DEPOSIT' as const, name: 'Security Deposit', amount: '5000', dueDate: '2026-01-15', status: 'PAID' as const, paidAt: new Date('2026-01-10') },
      { studentUserId: studentUser.id, head: 'PROCESSING_FEE' as const, name: 'Processing Fee', amount: '500', dueDate: '2026-01-15', status: 'PAID' as const, paidAt: new Date('2026-01-10') },
      { studentUserId: studentUser.id, head: 'ELECTRICITY_FEE' as const, name: 'Electricity - Feb 2026', amount: '800', dueDate: '2026-03-10', status: 'OVERDUE' as const },
    ];
    const insertedFees = await db.insert(fees).values(feeData).onConflictDoNothing().returning();
    console.log(`  Fees: ${insertedFees.length} created`);

    // ------------------------------------------------------------------
    // 5. Room allocation for the student
    // ------------------------------------------------------------------
    if (insertedRooms.length > 0) {
      const allocation = await db.insert(roomAllocations).values({
        studentUserId: studentUser.id,
        roomId: insertedRooms[0].id,
        allocatedBy: superUser?.id,
        status: 'ACTIVE',
      }).onConflictDoNothing().returning();
      console.log(`  Room allocations: ${allocation.length} created`);
    }

    // ------------------------------------------------------------------
    // 6. Leave requests
    // ------------------------------------------------------------------
    const leaveData = [
      { studentUserId: studentUser.id, type: 'HOME_VISIT' as const, startTime: new Date('2026-03-25T09:00:00Z'), endTime: new Date('2026-03-28T18:00:00Z'), reason: 'Family function - brother wedding', destination: 'Pune', status: 'APPROVED' as const, approvedBy: superUser?.id, approvedAt: new Date('2026-03-20') },
      { studentUserId: studentUser.id, type: 'MEDICAL' as const, startTime: new Date('2026-04-05T08:00:00Z'), endTime: new Date('2026-04-06T18:00:00Z'), reason: 'Doctor appointment', status: 'PENDING' as const },
      { studentUserId: studentUser.id, type: 'SHORT_LEAVE' as const, startTime: new Date('2026-02-15T14:00:00Z'), endTime: new Date('2026-02-15T20:00:00Z'), reason: 'Shopping for essentials', status: 'COMPLETED' as const, approvedBy: superUser?.id },
    ];
    const insertedLeaves = await db.insert(leaveRequests).values(leaveData).onConflictDoNothing().returning();
    console.log(`  Leave requests: ${insertedLeaves.length} created`);

    // ------------------------------------------------------------------
    // 7. Notifications
    // ------------------------------------------------------------------
    const notifData = [
      { userId: studentUser.id, type: 'FEE_REMINDER' as const, title: 'Fee Payment Reminder', message: 'Your hostel fee of ₹15,000 is due on April 15, 2026.' },
      { userId: studentUser.id, type: 'LEAVE_APPROVED' as const, title: 'Leave Approved', message: 'Your leave request from March 25-28 has been approved.' },
      { userId: studentUser.id, type: 'FEE_OVERDUE' as const, title: 'Electricity Fee Overdue', message: 'Your electricity fee of ₹800 is overdue. Please pay immediately.' },
      { userId: studentUser.id, type: 'ROOM_ALLOCATION' as const, title: 'Room Allocated', message: 'You have been allocated Room A-101 in Boys Hostel Block A.' },
      { userId: studentUser.id, type: 'ANNOUNCEMENT' as const, title: 'Hostel Inspection Notice', message: 'Room inspection scheduled for March 22, 2026. Please keep your room clean.' },
    ];
    const insertedNotifs = await db.insert(notifications).values(notifData).onConflictDoNothing().returning();
    console.log(`  Notifications: ${insertedNotifs.length} created`);
  }

  // ------------------------------------------------------------------
  // 8. Leave types configuration
  // ------------------------------------------------------------------
  const leaveTypeData = [
    { name: 'Home Visit', description: 'Visit home for family events or personal reasons', maxDays: '7', requiresApproval: true },
    { name: 'Short Leave', description: 'Short outing for shopping, errands, etc.', maxDays: '1', requiresApproval: true },
    { name: 'Medical Leave', description: 'Medical appointment or illness', maxDays: '14', requiresApproval: true },
    { name: 'Emergency Leave', description: 'Urgent family or personal emergency', maxDays: '3', requiresApproval: true },
  ];
  const insertedLeaveTypes = await db.insert(leaveTypes).values(leaveTypeData).onConflictDoNothing().returning();
  console.log(`  Leave types: ${insertedLeaveTypes.length} created`);

  // ------------------------------------------------------------------
  // 9. Notification rules
  // ------------------------------------------------------------------
  const ruleData = [
    { eventType: 'LEAVE_APPLICATION', timing: 'IMMEDIATE', channels: { sms: true, whatsapp: true, email: false }, template: 'Your child {{student_name}} has applied for leave from {{start_date}} to {{end_date}}.', isActive: true },
    { eventType: 'LEAVE_APPROVAL', timing: 'IMMEDIATE', channels: { sms: true, whatsapp: true, email: true }, template: 'Leave application for {{student_name}} from {{start_date}} to {{end_date}} has been APPROVED.', isActive: true },
    { eventType: 'LEAVE_REJECTION', timing: 'IMMEDIATE', channels: { sms: true, whatsapp: true, email: true }, template: 'Leave application for {{student_name}} from {{start_date}} to {{end_date}} has been REJECTED. Reason: {{reason}}.', isActive: true },
    { eventType: 'EMERGENCY', timing: 'IMMEDIATE', channels: { sms: true, whatsapp: true, email: true }, template: 'URGENT: {{student_name}} - {{emergency_type}}. Contact Superintendent immediately.', isActive: true },
    { eventType: 'PAYMENT_RECEIVED', timing: 'IMMEDIATE', channels: { sms: true, email: true }, template: 'Payment of ₹{{amount}} received for {{student_name}}. Receipt: {{receipt_number}}.', isActive: true },
  ];
  const insertedRules = await db.insert(notificationRules).values(ruleData).onConflictDoNothing().returning();
  console.log(`  Notification rules: ${insertedRules.length} created`);

  // ------------------------------------------------------------------
  // 10. Blackout dates
  // ------------------------------------------------------------------
  const blackoutData = [
    { startDate: '2026-04-01', endDate: '2026-04-05', reason: 'Annual Day Celebrations', isActive: true },
    { startDate: '2026-08-15', endDate: '2026-08-15', reason: 'Independence Day', isActive: true },
  ];
  const insertedBlackouts = await db.insert(blackoutDates).values(blackoutData).onConflictDoNothing().returning();
  console.log(`  Blackout dates: ${insertedBlackouts.length} created`);

  // ------------------------------------------------------------------
  // 11. Audit log entry
  // ------------------------------------------------------------------
  if (studentUser) {
    await db.insert(auditLogs).values({
      entityType: 'USER',
      entityId: studentUser.id,
      action: 'LOGIN',
      actorId: studentUser.id,
      actorRole: 'STUDENT',
      ipAddress: '127.0.0.1',
      metadata: { method: 'email', timestamp: new Date().toISOString() },
    });
    console.log('  Audit logs: 1 created');
  }

  console.log('\nSeed complete!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
