'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/feedback/Modal';
import { SendMessagePanel, type SendMessageData, DEFAULT_TEMPLATES } from '@/components/communication/SendMessagePanel';
import type { TableColumn } from '@/components/types';
import { cn } from '@/components/utils';
import { Input } from '@/components/forms/Input';
import { DatePicker } from '@/components/forms/DatePicker';
import { Select, type SelectOption } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';

// Types
type Vertical = 'BOYS' | 'GIRLS' | 'DHARAMSHALA';
type LeaveType = 'short' | 'night-out' | 'multi-day';
type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentRoom: string;
  vertical: Vertical;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  fromTime?: string;
  toTime?: string;
  reason: string;
  destination?: string;
  contactNumber?: string;
  status: LeaveStatus;
  appliedDate: string;
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  parentContacted?: boolean;
}

interface AuditEntry {
  id: string;
  action: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'MESSAGE_SENT';
  performedBy: string;
  performedAt: string;
  remarks?: string;
}

interface LeaveRule {
  type: LeaveType;
  description: string;
  maxDays: string;
  noticeRequired: string;
}

export default function SuperintendentLeaveManagement() {
  const [selectedFilter, setSelectedFilter] = useState<'pending' | 'all'>('pending');
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Action modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    leave: LeaveRequest | null;
    remarks: string;
  }>({
    isOpen: false,
    type: 'approve',
    leave: null,
    remarks: ''
  });
  
  // Message panel state
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [selectedMessageRecipient, setSelectedMessageRecipient] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Fetch leave requests from API
  const fetchLeaveRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leaves');
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        if (Array.isArray(data)) {
          setLeaveRequests(data);
        } else if (data.data && Array.isArray(data.data)) {
          setLeaveRequests(data.data);
        } else {
          setLeaveRequests(getDefaultLeaves());
        }
      } else {
        setLeaveRequests(getDefaultLeaves());
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeaveRequests(getDefaultLeaves());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const getDefaultLeaves = (): LeaveRequest[] => [];

  // Leave rules (read-only from Task 12 config)
  const leaveRules: LeaveRule[] = [
    {
      type: 'short',
      description: 'For absences up to 2 days within city limits',
      maxDays: '2 days/month',
      noticeRequired: '24 hours notice required'
    },
    {
      type: 'night-out',
      description: 'Evening outing returning same night',
      maxDays: 'Return by 10:00 PM',
      noticeRequired: '24 hours prior approval required'
    },
    {
      type: 'multi-day',
      description: 'Extended leave requiring prior approval',
      maxDays: '7 days/semester',
      noticeRequired: '3 days notice required, parent/guardian consent'
    }
  ];

  // Filter leaves
  const filteredLeaves = leaveRequests.filter(leave => {
    const matchesFilter = selectedFilter === 'all' || leave.status === 'PENDING';
    const matchesType = selectedLeaveType === 'ALL' || leave.leaveType === selectedLeaveType;
    const matchesStatus = selectedStatus === 'ALL' || leave.status === selectedStatus;
    const studentName = leave.studentName || '';
    const studentRoom = leave.studentRoom || '';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       studentRoom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesType && matchesStatus && matchesSearch;
  });

  // Status badge variants
  const getStatusVariant = (status: LeaveStatus): BadgeVariant => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const handleSendMessage = async (data: SendMessageData) => {
    setIsSending(true);
    try {
      console.log('Sending message:', data);
      // Simulate message send
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
      setShowMessagePanel(false);
      setSelectedMessageRecipient(null);
    }
  };

  const handleApproveReject = async () => {
    if (!actionModal.leave || !actionModal.remarks.trim()) {
      return;
    }
    
    try {
      const endpoint = actionModal.type === 'approve' 
        ? `/api/leaves/${actionModal.leave.id}/approve`
        : `/api/leaves/${actionModal.leave.id}/reject`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remarks: actionModal.remarks,
          approved_by: 'superintendent' // In real app, get from session
        })
      });

      if (response.ok) {
        setActionModal({ isOpen: false, type: 'approve', leave: null, remarks: '' });
        setSelectedLeave(null);
        // Refresh the leaves list to reflect the status change
        fetchLeaveRequests();
        alert(`Leave ${actionModal.type === 'approve' ? 'approved' : 'rejected'} successfully`);
      } else {
        alert('Failed to process leave request');
      }
    } catch (err) {
      console.error('Error processing leave:', err);
      alert('Failed to process leave request');
    }
  };

  // Select options
  const leaveTypeOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Types' },
    { value: 'short', label: 'Short Leave' },
    { value: 'night-out', label: 'Night Out' },
    { value: 'multi-day', label: 'Multi-Day Leave' }
  ];

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Leave Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Review and manage student leave requests
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedFilter('pending')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                selectedFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Pending Requests ({leaveRequests.filter(l => l.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setSelectedFilter('all')}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Leaves ({leaveRequests.length})
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder="Search by student name or room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="min-w-[180px]">
              <Select
                label="Leave Type"
                options={leaveTypeOptions}
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value as LeaveType | 'ALL')}
              />
            </div>

            {selectedFilter === 'all' && (
              <div className="min-w-[180px]">
                <Select
                  label="Status"
                  options={statusOptions}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as LeaveStatus | 'ALL')}
                />
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedLeaveType('ALL');
                setSelectedStatus('ALL');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Leave Requests Table */}
        {isLoading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading leave requests...</p>
          </div>
        ) : (
        <div className="rounded-lg border" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Student
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Room
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Leave Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Dates
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Applied
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="border-b hover:bg-gray-50 cursor-pointer" style={{ borderColor: 'var(--border-primary)' }}>
                    <td className="px-4 py-3">
                      <div>
                        <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                          {leave.studentName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          ID: {leave.studentId}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {leave.studentRoom}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {leave.leaveType === 'short' && '📋'}
                          {leave.leaveType === 'night-out' && '🌙'}
                          {leave.leaveType === 'multi-day' && '📅'}
                        </span>
                        <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
                          {(leave.leaveType || '').replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {leave.fromDate}
                      {leave.fromTime && ` ${leave.fromTime}`}
                      <br />
                      → {leave.toDate}
                      {leave.toTime && ` ${leave.toTime}`}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {leave.reason}
                      {leave.destination && (
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          to {leave.destination}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(leave.status)} size="sm">
                        {leave.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {leave.appliedDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedLeave(leave)}
                        >
                          Review
                        </Button>
                        {leave.status === 'PENDING' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedMessageRecipient(leave.id);
                              setShowMessagePanel(true);
                            }}
                          >
                            Message
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeaves.length === 0 && (
            <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
              <p className="text-lg mb-2">No leave requests found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
        )}

      {/* Leave Detail/Review Modal */}
      <Modal
        isOpen={selectedLeave !== null}
        onClose={() => setSelectedLeave(null)}
        title="Leave Request Details"
        size="xl"
      >
        {selectedLeave && (
          <div className="space-y-6">
            {/* Student Information */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Student Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Name</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {selectedLeave.studentName}
                  </p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Room Number</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {selectedLeave.studentRoom}
                  </p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Student ID</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {selectedLeave.studentId}
                  </p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Vertical</label>
                  <Badge variant="info" size="sm" className="mt-1">
                    {selectedLeave.vertical}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Leave Details */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Leave Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Leave Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">
                      {selectedLeave.leaveType === 'short' && '📋'}
                      {selectedLeave.leaveType === 'night-out' && '🌙'}
                      {selectedLeave.leaveType === 'multi-day' && '📅'}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }} className="font-medium capitalize">
                      {(selectedLeave.leaveType || '').replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>From</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {selectedLeave.fromDate}
                    {selectedLeave.fromTime && ` ${selectedLeave.fromTime}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>To</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {selectedLeave.toDate}
                    {selectedLeave.toTime && ` ${selectedLeave.toTime}`}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reason</label>
                <p style={{ color: 'var(--text-primary)' }} className="font-medium mt-1">
                  {selectedLeave.reason}
                </p>
              </div>

              {selectedLeave.destination && (
                <div className="mb-4">
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Destination</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium mt-1">
                    {selectedLeave.destination}
                  </p>
                </div>
              )}

              {selectedLeave.contactNumber && (
                <div>
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Emergency Contact</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium mt-1">
                    {selectedLeave.contactNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Leave Rules Summary */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-blue-50)', borderLeft: '4px solid var(--color-blue-500)' }}>
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xl">📜</span>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Leave Rules Summary
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    These rules are configured in Settings and cannot be modified here
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {leaveRules.find(r => r.type === selectedLeave.leaveType) && (
                  <div className="text-sm">
                    <p style={{ color: 'var(--text-primary)' }}>
                      <strong>Description:</strong> {leaveRules.find(r => r.type === selectedLeave.leaveType)!.description}
                    </p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      <strong>Maximum Duration:</strong> {leaveRules.find(r => r.type === selectedLeave.leaveType)!.maxDays}
                    </p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      <strong>Notice Required:</strong> {leaveRules.find(r => r.type === selectedLeave.leaveType)!.noticeRequired}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status and Past Decisions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Current Status & Past Decisions
                </h3>
                <Badge variant={getStatusVariant(selectedLeave.status)} size="md">
                  {selectedLeave.status}
                </Badge>
              </div>

              {selectedLeave.status !== 'PENDING' && selectedLeave.approvedBy && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }}>Decision By</label>
                      <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                        {selectedLeave.approvedBy}
                      </p>
                    </div>
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }}>Decision Date</label>
                      <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                        {selectedLeave.approvedAt ? new Date(selectedLeave.approvedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label style={{ color: 'var(--text-secondary)' }}>Remarks</label>
                    <p style={{ color: 'var(--text-primary)' }} className="font-medium mt-1">
                      {selectedLeave.remarks || 'No remarks provided'}
                    </p>
                  </div>
                  <div className="mt-3">
                    <label style={{ color: 'var(--text-secondary)' }}>Parent Contacted</label>
                    <Badge variant={selectedLeave.parentContacted ? 'success' : 'warning'} size="sm" className="mt-1">
                      {selectedLeave.parentContacted ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedLeave.status === 'PENDING' && (
              <div className="flex flex-wrap gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setActionModal({
                      isOpen: true,
                      type: 'approve',
                      leave: selectedLeave,
                      remarks: ''
                    });
                  }}
                >
                  Approve Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setActionModal({
                      isOpen: true,
                      type: 'reject',
                      leave: selectedLeave,
                      remarks: ''
                    });
                  }}
                >
                  Reject Request
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedMessageRecipient(selectedLeave.id);
                    setShowMessagePanel(true);
                  }}
                >
                  Send Message to Student/Parent
                </Button>
              </div>
            )}

            {selectedLeave.status !== 'PENDING' && (
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedMessageRecipient(selectedLeave.id);
                    setShowMessagePanel(true);
                  }}
                >
                  Send Message
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve/Reject Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: 'approve', leave: null, remarks: '' })}
        title={actionModal.type === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        size="md"
        variant={actionModal.type === 'reject' ? 'destructive' : 'confirmation'}
        onConfirm={handleApproveReject}
        confirmText={actionModal.type === 'approve' ? 'Approve' : 'Reject'}
        confirmDisabled={!actionModal.remarks.trim()}
      >
        {actionModal.leave && (
          <div className="space-y-4">
            {/* Leave Summary */}
            <div className="p-4 rounded border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-primary)' }}>
              <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Leave Request Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Student:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {actionModal.leave.studentName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Room:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {actionModal.leave.studentRoom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Leave Type:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium capitalize">
                    {(actionModal.leave.leaveType || '').replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Dates:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {actionModal.leave.fromDate} → {actionModal.leave.toDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Reason:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {actionModal.leave.reason}
                  </span>
                </div>
              </div>
            </div>

            {/* Mandatory Remarks */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Remarks <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={actionModal.remarks}
                onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                placeholder={actionModal.type === 'approve'
                  ? 'Enter approval remarks (e.g., Leave approved for valid reason, parent notified)'
                  : 'Enter rejection reason (e.g., Insufficient notice, exam period, etc.)'
                }
                required
              />
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Remarks will be recorded in the audit log and visible to other superintendents and trustees.
                This action cannot be undone.
              </p>
            </div>

            {/* Audit Warning */}
            <div className="p-3 rounded border-l-4" style={{
              background: 'var(--color-yellow-50)',
              borderColor: 'var(--color-yellow-500)'
            }}>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <p className="font-medium text-yellow-800">Audit Trail Entry</p>
                  <p className="text-sm text-yellow-700">
                    Your decision will be logged with your name, timestamp, and remarks. This entry is immutable and cannot be modified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Message Panel */}
      <SendMessagePanel
        isOpen={showMessagePanel}
        onClose={() => {
          setShowMessagePanel(false);
          setSelectedMessageRecipient(null);
        }}
        onSend={handleSendMessage}
        recipients={leaveRequests.map(leave => ({
          id: leave.id,
          name: leave.studentName,
          role: 'student' as const,
          phone: leave.contactNumber || '',
          email: ''
        }))}
        templates={DEFAULT_TEMPLATES}
        defaultRecipientId={selectedMessageRecipient || undefined}
        isLoading={isSending}
      />
    </div>
  );
}
