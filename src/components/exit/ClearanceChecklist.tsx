'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../utils';
import { ClearanceChecklistItem } from './ClearanceChecklistItem';
import { ExitClearanceChecklist, ClearanceItemStatus, ClearanceOwnerRole } from './types';

interface ClearanceChecklistProps {
  checklist: ExitClearanceChecklist;
  userRole?: ClearanceOwnerRole | 'STUDENT';
  onUpdateItemStatus?: (
    itemId: string,
    newStatus: ClearanceItemStatus,
    remarks?: string
  ) => void | Promise<void>;
  className?: string;
}

export const ClearanceChecklist: React.FC<ClearanceChecklistProps> = ({
  checklist,
  userRole,
  onUpdateItemStatus,
  className,
}) => {
  const { items, allMandatoryCompleted, blockingItems } = checklist;

  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === 'COMPLETED').length;
  const pendingMandatory = items.filter(
    (item) => item.isMandatory && item.status !== 'COMPLETED' && item.status !== 'WAIVED'
  ).length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Exit Clearance Checklist
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Complete all mandatory items before final exit approval
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {completedItems}/{totalItems}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              items completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Overall Progress
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                allMandatoryCompleted ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-3 rounded-lg"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Completed
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">{completedItems}</div>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Pending
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-600">
              {totalItems - completedItems}
            </div>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Mandatory Pending
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{pendingMandatory}</div>
          </div>
        </div>

        {/* Completion Status */}
        {allMandatoryCompleted ? (
          <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-green-900">
                  All Mandatory Items Completed
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  This exit request is ready for final approval. No items are blocking the approval process.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-orange-900">
                  Clearance In Progress
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  {pendingMandatory} mandatory {pendingMandatory === 1 ? 'item' : 'items'} still
                  pending. These must be completed before final exit approval.
                </p>
                {blockingItems.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-orange-800">Blocking items:</p>
                    <ul className="list-disc list-inside text-sm text-orange-700 mt-1">
                      {blockingItems.map((itemId) => {
                        const item = items.find((i) => i.id === itemId);
                        return item ? <li key={itemId}>{item.title}</li> : null;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Clearance Items
        </h3>

        {items.map((item) => (
          <ClearanceChecklistItem
            key={item.id}
            item={item}
            userRole={userRole}
            onUpdateStatus={onUpdateItemStatus}
          />
        ))}
      </div>
    </div>
  );
};

ClearanceChecklist.displayName = 'ClearanceChecklist';
