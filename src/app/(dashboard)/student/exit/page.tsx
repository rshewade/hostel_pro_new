'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components';
import {
  ExitRequestForm,
  ExitRequestData,
  ExitStatusBadge,
  ExitStatus,
  ExitImplicationsBanner,
  AuditTrailPanel,
  AuditEntry,
  ClearanceChecklist,
  ExitClearanceChecklist,
} from '@/components/exit';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function StudentExitPage() {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<ExitStatus>('DRAFT');
  const [exitRequest, setExitRequest] = useState<Partial<ExitRequestData> | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [clearanceChecklist, setClearanceChecklist] = useState<ExitClearanceChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch existing exit request on mount
  useEffect(() => {
    const fetchExitRequest = async () => {
      try {
        setLoading(true);

        // Mock API call - replace with actual API
        const response = await fetch('/api/student/exit-request');

        if (response.ok) {
          const data = await response.json();
          if (data.exitRequest) {
            setExitRequest(data.exitRequest);
            setCurrentStatus(data.status || 'DRAFT');
            setAuditTrail(data.auditTrail || []);
            setClearanceChecklist(data.clearanceChecklist || null);
          }
        }
      } catch (error) {
        console.error('Error fetching exit request:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExitRequest();
  }, []);

  const handleSubmit = async (data: ExitRequestData) => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/student/exit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();

        // Update state
        setExitRequest(data);
        setCurrentStatus('SUBMITTED');

        // Add audit entry
        const newEntry: AuditEntry = {
          id: Date.now().toString(),
          action: 'SUBMITTED',
          description: 'Exit request submitted for review',
          actor: 'Student Name', // Replace with actual user
          actorRole: 'Student',
          timestamp: new Date().toISOString(),
        };
        setAuditTrail((prev) => [newEntry, ...prev]);

        // Show success message
        alert('Exit request submitted successfully! You will be notified about the next steps.');
      } else {
        throw new Error('Failed to submit exit request');
      }
    } catch (error) {
      console.error('Error submitting exit request:', error);
      alert('Failed to submit exit request. Please try again.');
    }
  };

  const handleSaveDraft = async (data: Partial<ExitRequestData>) => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/student/exit-request/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setExitRequest(data);

        // Add audit entry if this is the first save
        if (auditTrail.length === 0) {
          const newEntry: AuditEntry = {
            id: Date.now().toString(),
            action: 'CREATED',
            description: 'Exit request draft created',
            actor: 'Student Name', // Replace with actual user
            actorRole: 'Student',
            timestamp: new Date().toISOString(),
          };
          setAuditTrail([newEntry]);
        } else {
          // Add edit entry
          const editEntry: AuditEntry = {
            id: Date.now().toString(),
            action: 'EDITED',
            description: 'Exit request draft updated',
            actor: 'Student Name', // Replace with actual user
            actorRole: 'Student',
            timestamp: new Date().toISOString(),
          };
          setAuditTrail((prev) => [editEntry, ...prev]);
        }

        alert('Draft saved successfully!');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const handleWithdraw = async () => {
    if (!showWithdrawConfirm) {
      setShowWithdrawConfirm(true);
      return;
    }

    setWithdrawing(true);
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/student/exit-request/withdraw', {
        method: 'POST',
      });

      if (response.ok) {
        setCurrentStatus('WITHDRAWN');

        // Add audit entry
        const newEntry: AuditEntry = {
          id: Date.now().toString(),
          action: 'WITHDRAWN',
          description: 'Exit request withdrawn by student',
          actor: 'Student Name', // Replace with actual user
          actorRole: 'Student',
          timestamp: new Date().toISOString(),
        };
        setAuditTrail((prev) => [newEntry, ...prev]);

        alert('Exit request withdrawn successfully.');
        setShowWithdrawConfirm(false);
      }
    } catch (error) {
      console.error('Error withdrawing exit request:', error);
      alert('Failed to withdraw exit request. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const canWithdraw = currentStatus === 'SUBMITTED';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading exit request...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Page Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard/student')} className="!p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Exit Request
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Initiate your hostel exit process
                </p>
              </div>
            </div>
            <ExitStatusBadge status={currentStatus} />
          </div>

          {/* Status-specific Banners */}
          {currentStatus === 'SUBMITTED' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Request Submitted</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your exit request has been submitted and is awaiting clearance processing. You will be notified when the clearance process begins.
                </p>
                {canWithdraw && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowWithdrawConfirm(true)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Withdraw Request
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStatus === 'UNDER_CLEARANCE' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-900">Clearance In Progress</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your exit clearance is being processed. Please ensure all pending items are completed. You cannot withdraw the request at this stage.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'APPROVED' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-green-900">Exit Approved</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your exit request has been approved! You can now download your exit certificate and complete the final formalities.
                </p>
                <div className="mt-3">
                  <Button variant="primary" size="sm">
                    Download Exit Certificate
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStatus === 'REJECTED' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900">Request Rejected</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your exit request has been rejected. Please contact the administration for more details.
                </p>
              </div>
            </div>
          )}

          {currentStatus === 'WITHDRAWN' && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Request Withdrawn</h3>
                <p className="text-sm text-gray-700 mt-1">
                  You have withdrawn your exit request. You can create a new request if needed.
                </p>
              </div>
            </div>
          )}

          {/* Implications Banner - shown only for DRAFT status */}
          {currentStatus === 'DRAFT' && <ExitImplicationsBanner />}

          {/* Exit Request Form */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              Exit Request Details
            </h2>
            <ExitRequestForm
              initialData={exitRequest || undefined}
              currentStatus={currentStatus}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              onCancel={() => router.push('/dashboard/student')}
            />
          </div>

          {/* Clearance Checklist - shown when clearance is active */}
          {clearanceChecklist && (currentStatus === 'UNDER_CLEARANCE' || currentStatus === 'APPROVED' || currentStatus === 'REJECTED') && (
            <ClearanceChecklist
              checklist={clearanceChecklist}
              userRole="STUDENT"
            />
          )}

          {/* Audit Trail */}
          <AuditTrailPanel entries={auditTrail} />
        </div>
      </main>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Confirm Withdrawal
                </h3>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to withdraw your exit request? This action will be recorded in the audit trail.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowWithdrawConfirm(false)}
                disabled={withdrawing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleWithdraw}
                loading={withdrawing}
                className="bg-red-600 hover:bg-red-700"
              >
                Withdraw Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
