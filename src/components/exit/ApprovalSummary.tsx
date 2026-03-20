'use client';

import React from 'react';
import {
  User,
  Home,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  IndianRupee,
  FileText,
} from 'lucide-react';
import { cn } from '../utils';
import {
  ExitApprovalData,
  ApprovalBlocker,
  FinancialSummary,
} from './types';

interface ApprovalSummaryProps {
  approvalData: ExitApprovalData;
  className?: string;
}

export const ApprovalSummary: React.FC<ApprovalSummaryProps> = ({
  approvalData,
  className,
}) => {
  const {
    studentName,
    studentId,
    roomNumber,
    vertical,
    requestedExitDate,
    submittedDate,
    checklist,
    financialSummary,
    blockers,
    canApprove,
  } = approvalData;

  const completedItems = checklist.items.filter((i) => i.status === 'COMPLETED').length;
  const totalItems = checklist.items.length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const errorBlockers = blockers.filter((b) => b.severity === 'ERROR');
  const warningBlockers = blockers.filter((b) => b.severity === 'WARNING');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Student Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Student Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Student Name
              </div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {studentName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Student ID
              </div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {studentId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Room Number
              </div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {roomNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Hostel Vertical
              </div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {vertical}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Requested Exit Date
              </div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {new Date(requestedExitDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Submitted Date
              </div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {new Date(submittedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clearance Progress */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Clearance Progress
        </h3>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Overall Completion
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {completedItems}/{totalItems} ({progressPercentage}%)
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                checklist.allMandatoryCompleted ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Checklist Items Summary */}
        <div className="space-y-2">
          {checklist.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                item.status === 'COMPLETED'
                  ? 'bg-green-50 border border-green-200'
                  : item.status === 'WAIVED'
                  ? 'bg-purple-50 border border-purple-200'
                  : 'bg-gray-50 border border-gray-200'
              )}
            >
              <div className="flex items-center gap-3">
                {item.status === 'COMPLETED' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : item.status === 'WAIVED' ? (
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                    {item.isMandatory && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Owner: {item.ownerRole}
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  item.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : item.status === 'WAIVED'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {item.status === 'WAIVED' ? 'Waived' : item.status}
              </span>
            </div>
          ))}
        </div>

        {/* All Mandatory Completed */}
        {checklist.allMandatoryCompleted && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                All mandatory items completed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <FinancialSummaryCard financialSummary={financialSummary} />

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Approval Blockers
          </h3>

          <div className="space-y-3">
            {/* Errors */}
            {errorBlockers.map((blocker) => (
              <BlockerCard key={blocker.id} blocker={blocker} />
            ))}

            {/* Warnings */}
            {warningBlockers.map((blocker) => (
              <BlockerCard key={blocker.id} blocker={blocker} />
            ))}
          </div>
        </div>
      )}

      {/* Approval Status */}
      <div className="card p-6">
        <div className="flex items-start gap-3">
          {canApprove ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Ready for Approval
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  All requirements have been met. This exit request can now be approved.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-orange-900">
                  Cannot Approve Yet
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  {errorBlockers.length} error(s) must be resolved before approval.
                  {warningBlockers.length > 0 &&
                    ` ${warningBlockers.length} warning(s) require attention.`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for financial summary
const FinancialSummaryCard: React.FC<{ financialSummary: FinancialSummary }> = ({
  financialSummary,
}) => {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        <IndianRupee className="w-5 h-5 inline mr-2" />
        Financial Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Security Deposit
          </div>
          <div className="text-xl font-bold text-green-600">
            ₹{financialSummary.securityDeposit.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Pending Dues
          </div>
          <div
            className={cn(
              'text-xl font-bold',
              financialSummary.pendingDues > 0 ? 'text-red-600' : 'text-green-600'
            )}
          >
            ₹{financialSummary.pendingDues.toLocaleString()}
          </div>
        </div>

        {financialSummary.messDues !== undefined && financialSummary.messDues > 0 && (
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Mess Dues
            </div>
            <div className="text-lg font-semibold text-orange-600">
              ₹{financialSummary.messDues.toLocaleString()}
            </div>
          </div>
        )}

        {financialSummary.libraryDues !== undefined && financialSummary.libraryDues > 0 && (
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Library Dues
            </div>
            <div className="text-lg font-semibold text-orange-600">
              ₹{financialSummary.libraryDues.toLocaleString()}
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 md:col-span-2">
          <div className="text-sm font-medium text-blue-900">Refund Amount</div>
          <div className="text-2xl font-bold text-blue-700">
            ₹{financialSummary.refundAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {financialSummary.clearanceRemarks && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50">
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Clearance Remarks
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {financialSummary.clearanceRemarks}
          </div>
        </div>
      )}

      {financialSummary.isClearanceComplete ? (
        <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Financial clearance complete
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">
              Financial clearance pending
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for blocker cards
const BlockerCard: React.FC<{ blocker: ApprovalBlocker }> = ({ blocker }) => {
  const isError = blocker.severity === 'ERROR';

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        isError
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
      )}
    >
      <div className="flex items-start gap-3">
        {isError ? (
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div
            className={cn(
              'text-sm font-semibold',
              isError ? 'text-red-900' : 'text-yellow-900'
            )}
          >
            {blocker.title}
          </div>
          <div
            className={cn(
              'text-sm mt-1',
              isError ? 'text-red-700' : 'text-yellow-700'
            )}
          >
            {blocker.description}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-full font-medium',
                isError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              )}
            >
              {blocker.type}
            </span>
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-full font-medium',
                isError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              )}
            >
              {blocker.severity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

ApprovalSummary.displayName = 'ApprovalSummary';
