'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock, FileWarning } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { OverrideReason, ApprovalMetadata } from './types';

interface ApprovalOverrideModalProps {
  studentName: string;
  originalApproval: ApprovalMetadata;
  onConfirm: (reason: OverrideReason, justification: string) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const OVERRIDE_REASONS: Array<{
  value: OverrideReason;
  label: string;
  description: string;
}> = [
  {
    value: 'DATA_ERROR',
    label: 'Data Entry Error',
    description: 'Incorrect data was used during the original approval process',
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency Situation',
    description: 'Urgent circumstances require immediate reversal',
  },
  {
    value: 'POLICY_EXCEPTION',
    label: 'Policy Exception',
    description: 'Special institutional policy allows for reversal',
  },
  {
    value: 'TECHNICAL_ISSUE',
    label: 'Technical/System Issue',
    description: 'System error or malfunction occurred during approval',
  },
  {
    value: 'OTHER',
    label: 'Other (Specify)',
    description: 'Reason not covered by standard categories',
  },
];

export const ApprovalOverrideModal: React.FC<ApprovalOverrideModalProps> = ({
  studentName,
  originalApproval,
  onConfirm,
  onCancel,
  className,
}) => {
  const [selectedReason, setSelectedReason] = useState<OverrideReason | ''>('');
  const [justification, setJustification] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [overriding, setOverriding] = useState(false);

  const requiredConfirmText = 'OVERRIDE APPROVAL';
  const isValid =
    selectedReason &&
    justification.trim().length >= 50 &&
    confirmText === requiredConfirmText &&
    understood;

  const handleOverride = async () => {
    if (!isValid || !selectedReason) return;

    setOverriding(true);
    try {
      await onConfirm(selectedReason, justification);
    } catch (error) {
      console.error('Error overriding approval:', error);
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl max-w-3xl w-full my-8',
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b bg-red-50" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-red-900">
                Override Exit Approval
              </h2>
              <p className="text-sm mt-1 text-red-700">
                <strong>Admin Override Action</strong> - This is a highly privileged operation
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Critical Warning */}
          <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-2">
                  CRITICAL: Exceptional Override Operation
                </p>
                <p className="text-sm text-red-700">
                  You are about to reverse an approved exit request. This override capability is
                  reserved for exceptional circumstances only and requires detailed justification.
                  This action will be prominently logged in the audit trail and may be subject to
                  review.
                </p>
              </div>
            </div>
          </div>

          {/* Original Approval Info */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              Original Approval Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Student:</span>{' '}
                <strong className="text-blue-900">{studentName}</strong>
              </div>
              <div>
                <span className="text-blue-700">Approved By:</span>{' '}
                <strong className="text-blue-900">{originalApproval.approverName}</strong>
              </div>
              <div>
                <span className="text-blue-700">Role:</span>{' '}
                <strong className="text-blue-900">{originalApproval.approverRole}</strong>
              </div>
              <div>
                <span className="text-blue-700">Timestamp:</span>{' '}
                <strong className="text-blue-900">
                  {new Date(originalApproval.timestamp).toLocaleString()}
                </strong>
              </div>
            </div>
            {originalApproval.remarks && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <span className="text-sm text-blue-700">Approval Remarks:</span>
                <p className="text-sm text-blue-900 mt-1">{originalApproval.remarks}</p>
              </div>
            )}
          </div>

          {/* Override Reason Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Override Reason <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {OVERRIDE_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedReason === reason.value
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="radio"
                    name="override-reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value as OverrideReason)}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {reason.label}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {reason.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Detailed Justification */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Detailed Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={5}
              className="input w-full"
              placeholder="Provide a comprehensive explanation for this override. Minimum 50 characters required..."
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                This justification will be permanently recorded and may be reviewed by auditors.
              </p>
              <span
                className={cn(
                  'text-xs font-medium',
                  justification.length >= 50 ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {justification.length}/50
              </span>
            </div>
          </div>

          {/* Audit Trail Notice */}
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <FileWarning className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  Audit Trail Impact
                </p>
                <p className="text-sm text-yellow-700">
                  This override will create a <strong>prominent audit entry</strong> that
                  references the original approval, includes your justification, and is flagged
                  for administrative review. Both the approval and reversal will remain in the
                  permanent audit log.
                </p>
              </div>
            </div>
          </div>

          {/* Understanding Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="understand-override"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="understand-override"
              className="text-sm cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              I understand this is an <strong>exceptional override</strong> that will be
              prominently logged and may be subject to institutional review
            </label>
          </div>

          {/* Confirmation Text Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Type the following to confirm <span className="text-red-500">*</span>
            </label>
            <div className="p-3 rounded bg-red-100 mb-2 border border-red-200">
              <code className="text-sm font-mono font-bold text-red-900">
                {requiredConfirmText}
              </code>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={cn(
                'input w-full font-mono',
                confirmText && confirmText !== requiredConfirmText && 'border-red-300'
              )}
              placeholder="Type the confirmation text exactly as shown above"
            />
            {confirmText && confirmText !== requiredConfirmText && (
              <p className="text-xs text-red-600 mt-1">
                Text does not match. Please type exactly as shown above.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-primary)' }}>
          <Button variant="ghost" onClick={onCancel} disabled={overriding}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleOverride}
            loading={overriding}
            disabled={!isValid}
            className="bg-red-600 hover:bg-red-700"
          >
            <Lock className="w-4 h-4 mr-2" />
            Execute Override
          </Button>
        </div>
      </div>
    </div>
  );
};

ApprovalOverrideModal.displayName = 'ApprovalOverrideModal';
