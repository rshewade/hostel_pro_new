'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Home, Calendar, Mail, Phone, MessageSquare, IndianRupee } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { ClearanceChecklist } from './ClearanceChecklist';
import { AuditTrailPanel } from './AuditTrailPanel';
import {
  ExitRequestSummary,
  ExitClearanceChecklist,
  ClearanceOwnerRole,
  ClearanceItemStatus,
} from './types';
import { AuditEntry } from './AuditTrailPanel';

interface ClearanceDetailModalProps {
  request: ExitRequestSummary;
  userRole: ClearanceOwnerRole;
  onClose: () => void;
  onUpdateItemStatus?: (
    itemId: string,
    newStatus: ClearanceItemStatus,
    remarks?: string
  ) => Promise<void>;
  className?: string;
}

export const ClearanceDetailModal: React.FC<ClearanceDetailModalProps> = ({
  request,
  userRole,
  onClose,
  onUpdateItemStatus,
  className,
}) => {
  const [checklist, setChecklist] = useState<ExitClearanceChecklist | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clearance' | 'communication' | 'financial'>('clearance');

  // Fetch clearance checklist and audit trail
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Mock API call - replace with actual API
        const response = await fetch(`/api/exit-requests/${request.id}/clearance`);

        if (response.ok) {
          const data = await response.json();
          setChecklist(data.checklist);
          setAuditTrail(data.auditTrail || []);
        }
      } catch (error) {
        console.error('Error fetching clearance details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [request.id]);

  const handleUpdateItemStatus = async (
    itemId: string,
    newStatus: ClearanceItemStatus,
    remarks?: string
  ) => {
    if (onUpdateItemStatus) {
      await onUpdateItemStatus(itemId, newStatus, remarks);

      // Refresh data after update
      const response = await fetch(`/api/exit-requests/${request.id}/clearance`);
      if (response.ok) {
        const data = await response.json();
        setChecklist(data.checklist);
        setAuditTrail(data.auditTrail || []);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl w-full max-w-5xl my-8',
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex-1">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Clearance Details - {request.studentName}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {request.studentId}
              </span>
              <span className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                Room {request.roomNumber}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {request.vertical}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Exit: {new Date(request.requestedExitDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="!p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('clearance')}
              className={cn(
                'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'clearance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Clearance Checklist
            </button>
            <button
              onClick={() => setActiveTab('communication')}
              className={cn(
                'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'communication'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Communication History
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={cn(
                'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'financial'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <IndianRupee className="w-4 h-4 inline mr-1" />
              Financial Settlement
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading clearance details...</p>
            </div>
          ) : (
            <>
              {/* Clearance Tab */}
              {activeTab === 'clearance' && checklist && (
                <div className="space-y-6">
                  <ClearanceChecklist
                    checklist={checklist}
                    userRole={userRole}
                    onUpdateItemStatus={handleUpdateItemStatus}
                  />

                  {/* Audit Trail */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                      Clearance Audit Trail
                    </h3>
                    <AuditTrailPanel entries={auditTrail} />
                  </div>
                </div>
              )}

              {/* Communication Tab */}
              {activeTab === 'communication' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Communication History
                    </h3>
                    <Button variant="secondary" size="sm">
                      <Mail className="w-4 h-4 mr-1" />
                      Send Message
                    </Button>
                  </div>

                  {/* Placeholder for communication history */}
                  <div className="card p-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Communication History
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      View all messages, emails, and notifications sent to the student regarding their exit request.
                      This feature will be available soon.
                    </p>
                  </div>

                  {/* Student Contact Info */}
                  <div className="card p-4">
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                      Student Contact Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          student@example.com
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          +91 98765 43210
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Tab */}
              {activeTab === 'financial' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Financial Settlement
                    </h3>
                    <Button variant="secondary" size="sm">
                      View Full Statement
                    </Button>
                  </div>

                  {/* Placeholder for financial information */}
                  <div className="card p-8 text-center">
                    <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Financial Settlement Summary
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      View security deposit status, pending dues, refund calculations, and payment history.
                      This feature will be available soon.
                    </p>
                  </div>

                  {/* Quick Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Security Deposit
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        ₹10,000
                      </div>
                    </div>
                    <div className="card p-4">
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Pending Dues
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        ₹0
                      </div>
                    </div>
                    <div className="card p-4">
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Refund Amount
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        ₹10,000
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 rounded-b-lg" style={{ borderColor: 'var(--border-primary)' }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

ClearanceDetailModal.displayName = 'ClearanceDetailModal';
