'use client';

import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Ban, Edit3 } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { ClearanceItem, ClearanceItemStatus, ClearanceOwnerRole } from './types';
import { ClearanceItemHistory } from './ClearanceItemHistory';

interface ClearanceChecklistItemProps {
  item: ClearanceItem;
  userRole?: ClearanceOwnerRole | 'STUDENT';
  onUpdateStatus?: (
    itemId: string,
    newStatus: ClearanceItemStatus,
    remarks?: string
  ) => void | Promise<void>;
  className?: string;
}

const statusConfig: Record<
  ClearanceItemStatus,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  PENDING: {
    label: 'Pending',
    icon: <Clock className="w-5 h-5" />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: <Edit3 className="w-5 h-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  COMPLETED: {
    label: 'Completed',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  WAIVED: {
    label: 'Waived',
    icon: <Ban className="w-5 h-5" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
};

export const ClearanceChecklistItem: React.FC<ClearanceChecklistItemProps> = ({
  item,
  userRole,
  onUpdateStatus,
  className,
}) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ClearanceItemStatus>(item.status);
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const config = statusConfig[item.status];
  const canUpdate = userRole && userRole !== 'STUDENT' && userRole === item.ownerRole;
  const isStudent = userRole === 'STUDENT';

  const handleUpdate = async () => {
    if (!onUpdateStatus) return;

    setUpdating(true);
    try {
      await onUpdateStatus(item.id, selectedStatus, remarks);
      setShowUpdateModal(false);
      setRemarks('');
    } catch (error) {
      console.error('Error updating clearance item:', error);
      alert('Failed to update clearance status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'p-4 rounded-lg border',
          item.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'bg-white',
          className
        )}
        style={{ borderColor: item.status !== 'COMPLETED' ? 'var(--border-primary)' : undefined }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('flex-shrink-0', config.color)}>{config.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                  {item.isMandatory && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium',
                  config.bgColor,
                  config.color
                )}
              >
                {config.label}
              </span>

              <span style={{ color: 'var(--text-secondary)' }}>
                Owner: <strong>{item.ownerRole}</strong>
              </span>

              {item.lastUpdatedBy && (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Updated by: <strong>{item.lastUpdatedBy}</strong>
                </span>
              )}

              <span style={{ color: 'var(--text-secondary)' }}>
                {new Date(item.lastUpdatedAt).toLocaleDateString()}
              </span>
            </div>

            {item.remarks && (
              <div
                className="mt-3 p-3 rounded text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                <strong>Remarks:</strong> {item.remarks}
              </div>
            )}

            {isStudent && item.studentInstructions && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>Instructions:</strong> {item.studentInstructions}
                  </div>
                </div>
              </div>
            )}

            <ClearanceItemHistory history={item.history} className="mt-3" />
          </div>

          {canUpdate && onUpdateStatus && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowUpdateModal(true)}
              disabled={item.status === 'COMPLETED'}
            >
              Update Status
            </Button>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Update Clearance Status
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Item: {item.title}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  New Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ClearanceItemStatus)}
                  className="input w-full"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="WAIVED">Waived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Remarks {selectedStatus === 'WAIVED' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="input w-full"
                  placeholder="Add remarks about this status change..."
                />
              </div>

              {selectedStatus === 'COMPLETED' && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>Note:</strong> Marking as Completed is an irreversible action. This change
                    will be logged in the audit trail.
                  </p>
                </div>
              )}

              {selectedStatus === 'WAIVED' && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <p className="text-sm text-orange-900">
                    <strong>Warning:</strong> Waiving this item requires justification in the remarks
                    field. This action will be logged.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUpdateModal(false);
                  setRemarks('');
                  setSelectedStatus(item.status);
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                loading={updating}
                disabled={selectedStatus === 'WAIVED' && !remarks.trim()}
              >
                Update Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ClearanceChecklistItem.displayName = 'ClearanceChecklistItem';
