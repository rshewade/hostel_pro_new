'use client';

import { useState } from 'react';
import { AdminRenewalList } from '@/components/renewal/AdminRenewalList';
import { AdminRenewalDetail } from '@/components/renewal/AdminRenewalDetail';

export default function AdminRenewalPage() {
  const [selectedRenewal, setSelectedRenewal] = useState<string | null>(null);
  const [currentVertical, setCurrentVertical] = useState('BOYS');

  const handleApprove = (id: string, remarks: string, notifyStudent: boolean, notifyParent: boolean) => {
    console.log('Approve:', { id, remarks, notifyStudent, notifyParent });
    setSelectedRenewal(null);
  };

  const handleReject = (id: string, remarks: string, notifyStudent: boolean, notifyParent: boolean) => {
    console.log('Reject:', { id, remarks, notifyStudent, notifyParent });
    setSelectedRenewal(null);
  };

  if (selectedRenewal) {
    return (
      <div className="mx-auto max-w-7xl">
        <AdminRenewalDetail
          renewalId={selectedRenewal}
          studentName="Amit Kumar Jain"
          studentId="STU001"
          vertical={currentVertical}
          room="A-201"
          type="RENEWAL"
          status="UNDER_REVIEW"
          academicYear="2025-26"
          period="SEMESTER_1"
          documentsUploaded={[
            { type: 'marksheet_latest', fileName: 'marksheet_2024.pdf', uploadedAt: '2025-01-10T10:30:00Z', status: 'UPLOADED' },
            { type: 'id_proof', fileName: 'aadhar_card.pdf', uploadedAt: '2025-01-10T10:35:00Z', status: 'UPLOADED' },
          ]}
          paymentStatus="COMPLETE"
          amountDue={0}
          amountPaid={60000}
          consentGiven={true}
          consentTimestamp="2025-01-10T10:40:00Z"
          createdAt="2025-01-10T10:00:00Z"
          submittedAt="2025-01-10T10:45:00Z"
          reviewedAt={null}
          approvedAt={null}
          superintendentRemarks={null}
          onBack={() => setSelectedRenewal(null)}
          onApprove={(remarks, notifyStudent, notifyParent) => handleApprove(selectedRenewal, remarks, notifyStudent, notifyParent)}
          onReject={(remarks, notifyStudent, notifyParent) => handleReject(selectedRenewal, remarks, notifyStudent, notifyParent)}
          onRequestChanges={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdminRenewalList
        title="Renewal Applications"
        showVerticalFilter={true}
        currentVertical={currentVertical}
        onViewDetail={(id) => setSelectedRenewal(id)}
        onApprove={(id) => handleApprove(id, '', true, true)}
        onReject={(id) => handleReject(id, '', true, true)}
      />
    </div>
  );
}
