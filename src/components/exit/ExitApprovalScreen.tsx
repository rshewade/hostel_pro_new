'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, ShieldAlert, ArrowLeft, AlertTriangle } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { ApprovalSummary } from './ApprovalSummary';
import { ApprovalConfirmationModal } from './ApprovalConfirmationModal';
import { ApprovalOverrideModal } from './ApprovalOverrideModal';
import { AuditTrailPanel } from './AuditTrailPanel';
import type { AuditEntry } from './AuditTrailPanel';
import {
  ExitApprovalData,
  ApprovalMetadata,
  OverrideReason,
} from './types';

interface ExitApprovalScreenProps {
  approvalData: ExitApprovalData;
  auditTrail: AuditEntry[];
  userRole: string;
  userName: string;
  userId: string;
  canOverride?: boolean; // Admin-of-admins permission
  onApprove?: (metadata: ApprovalMetadata) => Promise<void>;
  onReject?: (remarks: string) => Promise<void>;
  onOverride?: (reason: OverrideReason, justification: string, metadata: ApprovalMetadata) => Promise<void>;
  onBack?: () => void;
  className?: string;
}

export const ExitApprovalScreen: React.FC<ExitApprovalScreenProps> = ({
  approvalData,
  auditTrail,
  userRole,
  userName,
  userId,
  canOverride = false,
  onApprove,
  onReject,
  onOverride,
  onBack,
  className,
}) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const isApproved = approvalData.currentStatus === 'APPROVED';
  const canShowOverride = canOverride && isApproved && approvalData.approvalHistory && approvalData.approvalHistory.length > 0;

  // Capture device and IP info
  const captureMetadata = (remarks: string): ApprovalMetadata => {
    const metadata: ApprovalMetadata = {
      approverRole: userRole,
      approverName: userName,
      approverId: userId,
      timestamp: new Date().toISOString(),
      remarks,
      deviceInfo: navigator.userAgent,
    };

    return metadata;
  };

  const handleApproveConfirm = async (remarks: string) => {
    if (!onApprove) return;

    const metadata = captureMetadata(remarks);
    await onApprove(metadata);
    setShowApprovalModal(false);
  };

  const handleReject = async () => {
    if (!onReject || !rejectRemarks.trim()) return;

    setRejecting(true);
    try {
      await onReject(rejectRemarks);
      setShowRejectModal(false);
      setRejectRemarks('');
    } catch (error) {
      console.error('Error rejecting exit request:', error);
    } finally {
      setRejecting(false);
    }
  };

  const handleOverrideConfirm = async (reason: OverrideReason, justification: string) => {
    if (!onOverride) return;

    const metadata = captureMetadata(justification);
    await onOverride(reason, justification, metadata);
    setShowOverrideModal(false);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="!p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Exit Request Approval
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Review and approve exit request for {approvalData.studentName}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {isApproved && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
            <CheckCircle className="w-5 h-5" />
            Approved
          </span>
        )}
      </div>

      {/* Approval Status Banner (if approved) */}
      {isApproved && approvalData.approvalHistory && approvalData.approvalHistory.length > 0 && (
        <div className="card p-6 bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                Exit Request Approved
              </h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-700">Approved By:</span>{' '}
                  <strong className="text-green-900">
                    {approvalData.approvalHistory[0].approverName}
                  </strong>
                </div>
                <div>
                  <span className="text-green-700">Role:</span>{' '}
                  <strong className="text-green-900">
                    {approvalData.approvalHistory[0].approverRole}
                  </strong>
                </div>
                <div className="md:col-span-2">
                  <span className="text-green-700">Timestamp:</span>{' '}
                  <strong className="text-green-900">
                    {new Date(approvalData.approvalHistory[0].timestamp).toLocaleString()}
                  </strong>
                </div>
                {approvalData.approvalHistory[0].remarks && (
                  <div className="md:col-span-2">
                    <span className="text-green-700">Remarks:</span>
                    <p className="text-green-900 mt-1">
                      {approvalData.approvalHistory[0].remarks}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-3 p-3 rounded bg-white border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> This exit request has been approved and the record is now
                  locked (read-only). Student has been transitioned to exited status.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Override Warning (if overridden) */}
      {approvalData.lastOverride && (
        <div className="card p-6 bg-red-50 border-2 border-red-300">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">
                Approval Overridden
              </h3>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="text-red-700">Override By:</span>{' '}
                  <strong className="text-red-900">
                    {approvalData.lastOverride.metadata.approverName}
                  </strong>
                </div>
                <div>
                  <span className="text-red-700">Reason:</span>{' '}
                  <strong className="text-red-900">{approvalData.lastOverride.reason}</strong>
                </div>
                <div>
                  <span className="text-red-700">Justification:</span>
                  <p className="text-red-900 mt-1">
                    {approvalData.lastOverride.metadata.remarks}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Summary */}
      <ApprovalSummary approvalData={approvalData} />

      {/* Action Buttons */}
      {!isApproved && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Approval Decision
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setShowApprovalModal(true)}
              disabled={!approvalData.canApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Exit Request
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(true)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Request
            </Button>

            {!approvalData.canApprove && (
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded">
                <AlertTriangle className="w-4 h-4" />
                Cannot approve: {approvalData.blockers.filter(b => b.severity === 'ERROR').length} blocker(s) must be resolved
              </div>
            )}
          </div>
        </div>
      )}

      {/* Override Action (for approved requests) */}
      {canShowOverride && (
        <div className="card p-6 border-2 border-red-200">
          <div className="flex items-start gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Admin Override
              </h3>
              <p className="text-sm text-red-700 mt-1">
                As an administrator, you can override this approval in exceptional circumstances.
                This action requires detailed justification and will be prominently logged.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => setShowOverrideModal(true)}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Override Approval
          </Button>
        </div>
      )}

      {/* Audit Trail */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Audit Trail
        </h3>
        <AuditTrailPanel entries={auditTrail} />
      </div>

      {/* Modals */}
      {showApprovalModal && (
        <ApprovalConfirmationModal
          studentName={approvalData.studentName}
          onConfirm={handleApproveConfirm}
          onCancel={() => setShowApprovalModal(false)}
        />
      )}

      {showOverrideModal && approvalData.approvalHistory && approvalData.approvalHistory.length > 0 && (
        <ApprovalOverrideModal
          studentName={approvalData.studentName}
          originalApproval={approvalData.approvalHistory[0]}
          onConfirm={handleOverrideConfirm}
          onCancel={() => setShowOverrideModal(false)}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Reject Exit Request
                </h3>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Please provide a reason for rejecting this exit request. The student will be
                  notified.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Rejection Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                rows={4}
                className="input w-full"
                placeholder="Explain why this exit request is being rejected..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectRemarks('');
                }}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReject}
                loading={rejecting}
                disabled={!rejectRemarks.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ExitApprovalScreen.displayName = 'ExitApprovalScreen';
