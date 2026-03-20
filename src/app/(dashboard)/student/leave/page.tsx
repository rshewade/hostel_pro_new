'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/forms/Input';
import { DatePicker } from '@/components/forms/DatePicker';
import { TimePicker } from '@/components/forms/TimePicker';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type LeaveType = 'short' | 'night-out' | 'multi-day';
type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface LeaveRequest {
  id: string;
  type: LeaveType;
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
}

interface LeaveRule {
  type: string;
  description: string;
}

export default function LeaveManagementPage() {
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [leaveRules, setLeaveRules] = useState<LeaveRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  // Fetch leave rules from database on mount
  useEffect(() => {
    const fetchLeaveRules = async () => {
      try {
        setRulesLoading(true);
        const response = await fetch('/api/config/leave-types?active=true');
        if (response.ok) {
          const result = await response.json();
          const data = result.data || result || [];
          const rules: LeaveRule[] = (Array.isArray(data) ? data : []).map((lt: any) => {
            const parts: string[] = [];
            if (lt.maxDaysPerMonth) parts.push(`Maximum ${lt.maxDaysPerMonth} days per month`);
            if (lt.maxDaysPerSemester) parts.push(`Maximum ${lt.maxDaysPerSemester} days per semester`);
            if (lt.requiresApproval) parts.push('Requires prior approval');
            return {
              type: lt.name,
              description: parts.length > 0 ? parts.join('. ') + '.' : 'Standard leave policy applies.',
            };
          });
          setLeaveRules(rules);
        }
      } catch (err) {
        console.error('Error fetching leave rules:', err);
      } finally {
        setRulesLoading(false);
      }
    };
    fetchLeaveRules();
  }, []);

  // Get student ID from localStorage on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (userId) {
      setStudentId(userId);
    } else if (token) {
      try {
        // Handle both JWT tokens (Supabase) and legacy base64 tokens
        if (token.includes('.')) {
          const payload = token.split('.')[1];
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const tokenData = JSON.parse(atob(base64));
          setStudentId(tokenData.sub);
        } else {
          const tokenData = JSON.parse(atob(token));
          setStudentId(tokenData.userId);
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  }, []);

  // Fetch leave history when studentId is available
  useEffect(() => {
    if (studentId) {
      fetchLeaveHistory();
    }
  }, [studentId]);

  const fetchLeaveHistory = async () => {
    if (!studentId) return;

    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/leaves?student_id=${studentId}`);
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result || [];
        // Transform API data to match LeaveRequest interface
        const transformedData: LeaveRequest[] = (Array.isArray(data) ? data : []).map((leave: any) => ({
          id: leave.id,
          type: leave.leaveType || 'short',
          fromDate: leave.fromDate || '',
          toDate: leave.toDate || '',
          fromTime: leave.fromTime || '',
          toTime: leave.toTime || '',
          reason: leave.reason || '',
          destination: leave.destination || '',
          contactNumber: leave.contactNumber || '',
          status: leave.status || 'PENDING',
          appliedDate: leave.appliedDate || '',
          remarks: leave.remarks || '',
        }));
        setLeaveHistory(transformedData);
      }
    } catch (err) {
      console.error('Error fetching leave history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    fromTime: '',
    toTime: '',
    reason: '',
    destination: '',
    contactNumber: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    contactNumber: ''
  });

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleTypeSelect = (type: LeaveType) => {
    setSelectedType(type);
    setShowForm(true);
    setFormData({
      fromDate: '',
      toDate: '',
      fromTime: '',
      toTime: '',
      reason: '',
      destination: '',
      contactNumber: ''
    });
    setFormErrors({
      fromDate: '',
      toDate: '',
      reason: '',
      contactNumber: ''
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = { ...formErrors };
    
    if (!formData.fromDate) {
      errors.fromDate = 'From date is required';
    }
    
    if (!formData.toDate) {
      errors.toDate = 'To date is required';
    }
    
    if (formData.fromDate && formData.toDate && new Date(formData.fromDate) > new Date(formData.toDate)) {
      errors.toDate = 'To date must be after from date';
    }
    
    if (!formData.reason.trim()) {
      errors.reason = 'Reason is required';
    }
    
    if (formData.reason.trim().length < 10) {
      errors.reason = 'Reason must be at least 10 characters';
    }
    
    if (selectedType === 'multi-day' && !formData.destination?.trim()) {
      errors.toDate = 'Destination is required for multi-day leave';
    }
    
    if (selectedType === 'night-out' && !formData.toTime) {
      errors.toDate = 'Return time is required for night-out';
    }
    
    setFormErrors(errors);
    return Object.values(errors).every(error => error === '');
  };

  const handleSubmit = async () => {
    if (!studentId) {
      alert('Unable to identify student. Please login again.');
      return;
    }

    if (validateForm()) {
      try {
        const leaveTypeMap: Record<LeaveType, string> = {
          'short': 'SHORT_LEAVE',
          'night-out': 'NIGHT_OUT',
          'multi-day': 'MULTI_DAY'
        };

        const response = await fetch('/api/leaves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            type: leaveTypeMap[selectedType!],
            start_time: `${formData.fromDate}T${formData.fromTime || '09:00'}:00Z`,
            end_time: `${formData.toDate}T${formData.toTime || '18:00'}:00Z`,
            reason: formData.reason,
            destination: formData.destination,
            contact_number: formData.contactNumber
          })
        });

        if (response.ok) {
          alert('Leave request submitted successfully!');
          setShowForm(false);
          setSelectedType(null);
          // Refresh leave history to show the new request
          fetchLeaveHistory();
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Leave request error:', errorData);
          alert('Failed to submit leave request: ' + (errorData.message || errorData.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error submitting leave request:', err);
        alert('Failed to submit leave request');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedType(null);
    setFormData({
      fromDate: '',
      toDate: '',
      fromTime: '',
      toTime: '',
      reason: '',
      destination: '',
      contactNumber: ''
    });
    setFormErrors({
      fromDate: '',
      toDate: '',
      reason: '',
      contactNumber: ''
    });
  };

  const getLeaveTypeInfo = (type: LeaveType) => {
    switch (type) {
      case 'short':
        return {
          icon: '📋',
          title: 'Short Leave',
          description: 'For absences up to 2 days within city limits',
          duration: 'Max 2 days/month'
        };
      case 'night-out':
        return {
          icon: '🌙',
          title: 'Night Out',
          description: 'Evening outing returning same night',
          duration: 'Return by 10:00 PM'
        };
      case 'multi-day':
        return {
          icon: '📅',
          title: 'Multi-Day Leave',
          description: 'Extended leave requiring prior approval',
          duration: 'Max 7 days/semester'
        };
    }
  };

  const pageContent = (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      <div className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold mb-2">
              Leave Management
            </h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-body">
              Request leave, view history, and check approval status
            </p>
          </div>

          {!showForm && !selectedType && (
            <div className="space-y-6">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-2xl font-semibold mb-6">
                Select Leave Type
              </h2>
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3 mb-8">
                {(['short', 'night-out', 'multi-day'] as LeaveType[]).map((type) => {
                  const info = getLeaveTypeInfo(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      className="card p-6 text-left transition-all hover:shadow-lg"
                      style={{
                        background: 'var(--surface-primary)',
                        borderColor: 'var(--border-primary)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <div className="text-4xl mb-3">{info.icon}</div>
                      <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold mb-2">
                        {info.title}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                        {info.description}
                      </p>
                      <p style={{ color: 'var(--color-blue-600)' }} className="text-xs font-medium mt-2">
                        {info.duration}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mb-8 p-6 rounded-lg" style={{ background: 'var(--surface-primary)', borderLeft: '4px solid var(--color-gold-500)' }}>
                <div className="flex items-start gap-2">
                  <span className="text-xl">📜</span>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold mb-2">
                      Leave Rules & Policies
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {rulesLoading ? (
                    <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>Loading rules...</p>
                  ) : leaveRules.length === 0 ? (
                    <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>No leave rules configured.</p>
                  ) : leaveRules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-accent)' }}>
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-primary)' }} className="font-medium mb-1">
                          {rule.type}
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showForm && selectedType && (
            <div className="mb-6">
              <button
                onClick={handleCancel}
                className="text-sm mb-6"
                style={{ color: 'var(--text-link)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                ← Back to Leave Types
              </button>

              <h2 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold mb-2">
                {getLeaveTypeInfo(selectedType).title} Application
              </h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-body mb-6">
                Fill in the required details to request {getLeaveTypeInfo(selectedType).title.toLowerCase()}
              </p>

              <div className="card p-6 rounded-lg" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  <div>
                    <DatePicker
                      label="From Date"
                      value={formData.fromDate}
                      onChange={(e) => handleInputChange('fromDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      error={formErrors.fromDate}
                      helperText="Select the start date of your leave"
                      required
                    />
                  </div>
                  <div>
                    <DatePicker
                      label="To Date"
                      value={formData.toDate}
                      onChange={(e) => handleInputChange('toDate', e.target.value)}
                      min={formData.fromDate}
                      error={formErrors.toDate}
                      helperText="Select the end date of your leave"
                      required
                    />
                  </div>
                </div>

                {(selectedType === 'short' || selectedType === 'night-out') && (
                  <div className="grid gap-6 md:grid-cols-2 mt-6">
                    <TimePicker
                      label="From Time"
                      value={formData.fromTime}
                      onChange={(e) => handleInputChange('fromTime', e.target.value)}
                      helperText="Start time for your leave"
                    />
                    <TimePicker
                      label="To Time"
                      value={formData.toTime}
                      onChange={(e) => handleInputChange('toTime', e.target.value)}
                      helperText="End time for your leave"
                    />
                  </div>
                )}

                <div className="mb-6 mt-6">
                  <Textarea
                    label="Reason for Leave"
                    placeholder="Please provide a detailed reason for your leave request"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    error={formErrors.reason}
                    helperText="Minimum 10 characters required. Include all relevant details."
                    required
                    rows={4}
                  />
                </div>

                {selectedType === 'multi-day' && (
                  <div className="mb-6">
                    <Input
                      type="text"
                      label="Destination"
                      placeholder="Where will you be going during your leave?"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      error={formErrors.toDate}
                      helperText="Destination city or place is required for multi-day leave"
                      required
                    />
                  </div>
                )}

                <div className="mb-6">
                  <Input
                    type="tel"
                    label="Emergency Contact Number (Optional)"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    helperText="Contact number for emergency during leave period"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                  >
                    Submit Leave Request
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!showForm && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 style={{ color: 'var(--text-primary)' }} className="text-2xl font-semibold">
                  Leave History
                </h2>
                <Button variant="ghost" size="sm" onClick={fetchLeaveHistory} disabled={historyLoading}>
                  {historyLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

              <div className="card" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
                <div className="overflow-x-auto">
                  {historyLoading ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                      Loading leave history...
                    </div>
                  ) : leaveHistory.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                      No leave requests found. Submit your first leave request above.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Type
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
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveHistory.map((leave) => (
                          <tr key={leave.id} className="border-b hover:bg-gray-50" style={{ borderColor: 'var(--border-primary)' }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {leave.type === 'short' && '📋'}
                                  {leave.type === 'night-out' && '🌙'}
                                  {leave.type === 'multi-day' && '📅'}
                                </span>
                                <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
                                  {leave.type.replace('-', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                              {leave.fromDate} → {leave.toDate}
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
                              {getStatusBadge(leave.status)}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {leave.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {pageContent}
    </>
  );
}
