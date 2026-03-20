'use client';

import React, { useState } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Modal } from '@/components/feedback/Modal';
import { RenewalStatusTracker } from './RenewalStatusTracker';
import { SendMessagePanel } from '@/components/communication/SendMessagePanel';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  IndianRupee,
  Shield,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  History,
  InfoIcon,
} from 'lucide-react';

export interface RenewalDetailProps {
  renewalId: string;
  studentName: string;
  studentId: string;
  vertical: string;
  room: string;
  type: 'NEW' | 'RENEWAL';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  academicYear: string;
  period: string;
  documentsUploaded: Array<{
    type: string;
    fileName: string;
    uploadedAt: string;
    status: string;
  }>;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETE';
  amountDue: number;
  amountPaid: number;
  consentGiven: boolean;
  consentTimestamp: string | null;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  superintendentRemarks: string | null;
  onBack: () => void;
  onApprove: (remarks: string, notifyStudent: boolean, notifyParent: boolean) => void;
  onReject: (remarks: string, notifyStudent: boolean, notifyParent: boolean) => void;
  onRequestChanges: (remarks: string, notifyStudent: boolean, notifyParent: boolean) => void;
  className?: string;
}

export const AdminRenewalDetail: React.FC<RenewalDetailProps> = ({
  renewalId,
  studentName,
  studentId,
  vertical,
  room,
  type,
  status,
  academicYear,
  period,
  documentsUploaded,
  paymentStatus,
  amountDue,
  amountPaid,
  consentGiven,
  consentTimestamp,
  createdAt,
  submittedAt,
  reviewedAt,
  approvedAt,
  superintendentRemarks,
  onBack,
  onApprove,
  onReject,
  onRequestChanges,
  className,
}) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [notifyStudent, setNotifyStudent] = useState(true);
  const [notifyParent, setNotifyParent] = useState(true);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'UNDER_REVIEW':
        return 'info';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = () => {
    onApprove(approveRemarks, notifyStudent, notifyParent);
    setShowApproveModal(false);
    setApproveRemarks('');
  };

  const handleReject = () => {
    onReject(rejectRemarks, notifyStudent, notifyParent);
    setShowRejectModal(false);
    setRejectRemarks('');
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to List
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Renewal Application Review
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {renewalId} | {type} | {academicYear} | {period}
          </p>
        </div>
        <Badge variant={getStatusVariant(status)} size="lg">
          {status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="md" shadow="sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <User className="w-5 h-5" />
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{studentName}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Student ID</p>
                <p className="font-mono" style={{ color: 'var(--text-primary)' }}>{studentId}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Vertical</p>
                <p style={{ color: 'var(--text-primary)' }}>{vertical}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Room</p>
                <p style={{ color: 'var(--text-primary)' }}>{room}</p>
              </div>
            </div>
          </Card>

          <Card padding="md" shadow="sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-5 h-5" />
              Documents ({documentsUploaded.length} uploaded)
            </h3>
            <div className="space-y-3">
              {documentsUploaded.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {doc.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {doc.fileName} | Uploaded: {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'VERIFIED' ? 'success' : 'warning'} size="sm">
                    {doc.status}
                  </Badge>
                </div>
              ))}
              {documentsUploaded.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No documents uploaded yet
                </p>
              )}
            </div>
          </Card>

          <Card padding="md" shadow="sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <IndianRupee className="w-5 h-5" />
              Payment Status
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 rounded-lg bg-gray-100">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Due</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  ₹{amountDue.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Paid</p>
                <p className="text-lg font-bold text-green-600">
                  ₹{amountPaid.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Status</p>
                <Badge variant={paymentStatus === 'COMPLETE' ? 'success' : paymentStatus === 'PARTIAL' ? 'warning' : 'error'} size="md">
                  {paymentStatus}
                </Badge>
              </div>
            </div>
          </Card>

          <Card padding="md" shadow="sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Shield className="w-5 h-5" />
              DPDP Consent
            </h3>
            <div className="flex items-center gap-3">
              {consentGiven ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">Consent Given</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {consentTimestamp ? `on ${formatDate(consentTimestamp)}` : ''}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-700">Consent Pending</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Student has not yet provided consent
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="md" shadow="sm">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Progress Tracker
            </h3>
            <RenewalStatusTracker
              currentStatus={status as any}
              showLabels={true}
              size="sm"
              orientation="vertical"
            />
          </Card>

          <Card padding="md" shadow="sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <History className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Created</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Submitted</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(submittedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Reviewed</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(reviewedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Approved</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(approvedAt)}</span>
              </div>
            </div>
          </Card>

          {superintendentRemarks && (
            <Card padding="md" shadow="sm">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Previous Remarks
              </h3>
              <p className="text-sm p-3 rounded bg-gray-100" style={{ color: 'var(--text-primary)' }}>
                {superintendentRemarks}
              </p>
            </Card>
          )}

          {status === 'UNDER_REVIEW' && (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setShowApproveModal(true)}
                leftIcon={<CheckCircle className="w-5 h-5" />}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setShowMessagePanel(true)}
                leftIcon={<MessageSquare className="w-5 h-5" />}
              >
                Send Message
              </Button>
              <Button
                variant="destructive"
                size="lg"
                fullWidth
                onClick={() => setShowRejectModal(true)}
                leftIcon={<XCircle className="w-5 h-5" />}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Renewal"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApprove}>
              Approve Renewal
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Remarks (Optional)"
            placeholder="Add any notes about this approval..."
            value={approveRemarks}
            onChange={(e) => setApproveRemarks(e.target.value)}
            rows={3}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Notify
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyStudent}
                onChange={(e) => setNotifyStudent(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Student</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyParent}
                onChange={(e) => setNotifyParent(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Parent/Guardian</span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Renewal"
        size="md"
        variant="destructive"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              Please provide a clear reason for rejection. The student will be notified and may need to resubmit.
            </p>
          </div>
          <Textarea
            label="Rejection Reason (Required)"
            placeholder="Explain why this renewal is being rejected..."
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            rows={3}
            required
          />
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Notify
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyStudent}
                onChange={(e) => setNotifyStudent(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Student</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyParent}
                onChange={(e) => setNotifyParent(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Parent/Guardian</span>
            </label>
          </div>
        </div>
      </Modal>

      {showMessagePanel && (
        <SendMessagePanel
          isOpen={showMessagePanel}
          onClose={() => setShowMessagePanel(false)}
          recipients={[
            { id: studentId, name: studentName, role: 'student' },
            { id: `${studentId}-parent`, name: `${studentName} (Parent)`, role: 'parent' }
          ]}
          templates={[]}
          onSend={async () => {}}
        />
      )}
    </div>
  );
};

export default AdminRenewalDetail;
