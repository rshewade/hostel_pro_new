'use client';

import React, { useState } from 'react';
import { AlertTriangle, Lock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { ApprovalConsequences } from './types';

interface ApprovalConfirmationModalProps {
  studentName: string;
  onConfirm: (remarks: string) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const APPROVAL_CONSEQUENCES: ApprovalConsequences = {
  title: 'Exit Approval Confirmation',
  description: 'You are about to approve this exit request. This is an irreversible action with the following consequences:',
  impacts: [
    'Student will be marked as EXITED and removed from active resident lists',
    'All exit request data and clearance checklist will be LOCKED (read-only)',
    'Student will lose access to resident-only features and dashboards',
    'Security deposit refund process will be initiated',
    'This action will be permanently recorded in the audit trail',
    'Room will be marked as vacant and available for new allocation',
    'Student data will be migrated to Alumni records',
  ],
};

export const ApprovalConfirmationModal: React.FC<ApprovalConfirmationModalProps> = ({
  studentName,
  onConfirm,
  onCancel,
  className,
}) => {
  const [remarks, setRemarks] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const requiredConfirmText = `APPROVE ${studentName.toUpperCase()}`;
  const isConfirmValid = confirmText === requiredConfirmText && understood && remarks.trim().length > 0;

  const handleConfirm = async () => {
    if (!isConfirmValid) return;

    setConfirming(true);
    try {
      await onConfirm(remarks);
    } catch (error) {
      console.error('Error confirming approval:', error);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl max-w-2xl w-full my-8',
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {APPROVAL_CONSEQUENCES.title}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Student: <strong>{studentName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Warning */}
          <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {APPROVAL_CONSEQUENCES.description}
                </p>
              </div>
            </div>
          </div>

          {/* Impacts */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Consequences of Approval:
            </h3>
            <div className="space-y-2">
              {APPROVAL_CONSEQUENCES.impacts.map((impact, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {impact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Reversibility Notice */}
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Irreversible Action
                </p>
                <p className="text-sm text-red-700">
                  This approval cannot be undone through normal means. Only administrators with
                  special override privileges can reverse this action in exceptional circumstances,
                  and such reversals require detailed justification and are prominently logged.
                </p>
              </div>
            </div>
          </div>

          {/* Approval Remarks */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Approval Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="input w-full"
              placeholder="Enter remarks about this approval decision (required)..."
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              These remarks will be permanently recorded in the audit trail.
            </p>
          </div>

          {/* Understanding Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="understand-consequences"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="understand-consequences"
              className="text-sm cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              I understand that this is an <strong>irreversible action</strong> and have reviewed
              all consequences listed above
            </label>
          </div>

          {/* Confirmation Text Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Type the following to confirm <span className="text-red-500">*</span>
            </label>
            <div className="p-3 rounded bg-gray-100 mb-2">
              <code className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
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
          <Button variant="ghost" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={confirming}
            disabled={!isConfirmValid}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Approval
          </Button>
        </div>
      </div>
    </div>
  );
};

ApprovalConfirmationModal.displayName = 'ApprovalConfirmationModal';
