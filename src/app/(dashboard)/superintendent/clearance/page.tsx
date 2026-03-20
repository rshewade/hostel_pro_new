'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components';
import {
  ExitDashboard,
  ClearanceDetailModal,
  ExitRequestSummary,
  ClearanceItemStatus,
} from '@/components/exit';
import { ArrowLeft, Download, AlertCircle } from 'lucide-react';

export default function SuperintendentClearancePage() {
  const router = useRouter();
  const [exitRequests, setExitRequests] = useState<ExitRequestSummary[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ExitRequestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<{
    requestIds: string[];
    action: string;
  } | null>(null);

  // Fetch exit requests on mount
  useEffect(() => {
    const fetchExitRequests = async () => {
      try {
        setLoading(true);

        // Mock API call - replace with actual API
        const response = await fetch('/api/superintendent/exit-clearance');

        if (response.ok) {
          const data = await response.json();
          setExitRequests(data.requests || []);
        }
      } catch (error) {
        console.error('Error fetching exit requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExitRequests();
  }, []);

  const handleViewDetails = (requestId: string) => {
    const request = exitRequests.find((r) => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
    }
  };

  const handleUpdateItemStatus = async (
    itemId: string,
    newStatus: ClearanceItemStatus,
    remarks?: string
  ) => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/clearance-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, remarks }),
      });

      if (response.ok) {
        // Refresh exit requests data
        const refreshResponse = await fetch('/api/superintendent/exit-clearance');
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setExitRequests(data.requests || []);
        }

        alert('Clearance item updated successfully!');
      } else {
        throw new Error('Failed to update clearance item');
      }
    } catch (error) {
      console.error('Error updating clearance item:', error);
      alert('Failed to update clearance item. Please try again.');
    }
  };

  const handleBulkAction = (requestIds: string[], action: string) => {
    setBulkAction({ requestIds, action });
    setShowBulkConfirm(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction) return;

    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/clearance-items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestIds: bulkAction.requestIds,
          action: bulkAction.action,
        }),
      });

      if (response.ok) {
        // Refresh exit requests data
        const refreshResponse = await fetch('/api/superintendent/exit-clearance');
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setExitRequests(data.requests || []);
        }

        alert(`Bulk action completed for ${bulkAction.requestIds.length} request(s)!`);
        setShowBulkConfirm(false);
        setBulkAction(null);
      } else {
        throw new Error('Failed to execute bulk action');
      }
    } catch (error) {
      console.error('Error executing bulk action:', error);
      alert('Failed to execute bulk action. Please try again.');
    }
  };

  const handleExportReport = async () => {
    try {
      // Mock API call - replace with actual API
      const response = await fetch('/api/superintendent/exit-clearance/export');

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exit-clearance-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading exit clearance requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Exit Clearance Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Manage and process student exit clearances
              </p>
            </div>
            <Button variant="secondary" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Info Banner */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Superintendent Responsibilities</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You are responsible for room inventory checks, key returns, and general clearance items.
                  Ensure all items are verified before marking as completed. All actions are logged in the audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <ExitDashboard
            requests={exitRequests}
            userRole="SUPERINTENDENT"
            onViewDetails={handleViewDetails}
            onBulkAction={handleBulkAction}
          />
        </div>
      </main>

      {/* Detail Modal */}
      {selectedRequest && (
        <ClearanceDetailModal
          request={selectedRequest}
          userRole="SUPERINTENDENT"
          onClose={() => setSelectedRequest(null)}
          onUpdateItemStatus={handleUpdateItemStatus}
        />
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkConfirm && bulkAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Confirm Bulk Action
                </h3>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to perform this action on {bulkAction.requestIds.length} exit request(s)?
                  This action will be logged in the audit trail.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowBulkConfirm(false);
                  setBulkAction(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={executeBulkAction}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
