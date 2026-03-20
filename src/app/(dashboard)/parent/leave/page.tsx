'use client';

import { useState, useEffect } from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import Link from 'next/link';

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
  status: LeaveStatus;
  appliedDate: string;
  superintendentRemarks?: string;
  parentNotified?: boolean;
  parentAcknowledged?: boolean;
}

interface StudentInfo {
  name: string;
  id: string;
  room: string;
  vertical: string;
}

export default function ParentLeaveView() {
  const [selectedFilter, setSelectedFilter] = useState<LeaveStatus | 'ALL'>('ALL');
  const [acknowledgedLeaves, setAcknowledgedLeaves] = useState<Set<string>>(new Set());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({ name: '', id: '', room: '', vertical: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const sessionToken = localStorage.getItem('parentSessionToken');
        if (!sessionToken) {
          setError('Please login to view leave requests.');
          setIsLoading(false);
          return;
        }

        // Fetch student info
        const studentRes = await fetch(`/api/parent/student?sessionToken=${encodeURIComponent(sessionToken)}`);
        if (studentRes.ok) {
          const studentResult = await studentRes.json();
          const student = Array.isArray(studentResult.data) ? studentResult.data[0] : studentResult.data;
          if (student) {
            setStudentInfo({
              name: student.name || 'N/A',
              id: student.id || 'N/A',
              room: student.room || 'Not Allocated',
              vertical: student.vertical || 'N/A',
            });
          }
        }

        // Fetch leave requests
        const leaveRes = await fetch(`/api/parent/leave?sessionToken=${encodeURIComponent(sessionToken)}`);
        if (leaveRes.ok) {
          const leaveResult = await leaveRes.json();
          const items = leaveResult.data?.items || [];
          const typeMap: Record<string, LeaveType> = {
            'Short Leave': 'short',
            'Night Out': 'night-out',
            'Multi-Day': 'multi-day',
          };
          const transformed: LeaveRequest[] = items.map((item: any) => ({
            id: item.id,
            type: typeMap[item.type] || 'short',
            fromDate: item.startDate || '',
            toDate: item.endDate || '',
            reason: item.reason || '',
            status: item.status || 'PENDING',
            appliedDate: item.appliedDate || '',
            superintendentRemarks: item.remarks || undefined,
            parentNotified: item.parentNotified ?? false,
            parentAcknowledged: item.parentAcknowledged ?? false,
          }));
          setLeaveRequests(transformed);
        } else {
          setError('Failed to load leave requests.');
        }
      } catch (err) {
        console.error('Error fetching parent leave data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const studentName = studentInfo.name;
  const studentId = studentInfo.id;
  const roomNumber = studentInfo.room;
  const vertical = studentInfo.vertical;

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

  const getLeaveTypeInfo = (type: LeaveType) => {
    switch (type) {
      case 'short':
        return { icon: '📋', label: 'Short Leave' };
      case 'night-out':
        return { icon: '🌙', label: 'Night Out' };
      case 'multi-day':
        return { icon: '📅', label: 'Multi-Day Leave' };
    }
  };

  const filteredLeaves = leaveRequests.filter(leave => {
    const matchesStatus = selectedFilter === 'ALL' || leave.status === selectedFilter;
    return matchesStatus;
  });

  const handleAcknowledge = (leaveId: string) => {
    setAcknowledgedLeaves(prev => new Set(prev).add(leaveId));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <header className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold">
              Parent Dashboard - Leave Management
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}>
              {vertical}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/parent" className="text-sm" style={{ color: 'var(--text-link)' }}>
              Back to Dashboard
            </Link>
            <Link href="/login/parent" className="text-sm" style={{ color: 'var(--text-link)' }}>
              Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 style={{ color: 'var(--text-primary)' }} className="text-3xl font-bold mb-2">
              Leave Requests for {studentName}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-lg">
              View-only access to your ward's leave history and status
            </p>
          </div>

          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ background: 'var(--color-blue-50)', borderLeft: '4px solid var(--color-blue-500)' }}>
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold mb-2">
                View-Only Access
              </h3>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                This page provides read-only access to view your ward's leave requests.
                <strong>You cannot create, edit, or approve leave requests through this portal.</strong>
                All leave management actions are handled by hostel administration.
              </p>
            </div>
          </div>

          <div className="card p-6 rounded-lg mb-6" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold">
                Student Information
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label style={{ color: 'var(--text-secondary)' }}>Name</label>
                <p style={{ color: 'var(--text-primary)' }} className="font-medium">{studentName}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }}>Student ID</label>
                <p style={{ color: 'var(--text-primary)' }} className="font-medium">{studentId}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }}>Room</label>
                <p style={{ color: 'var(--text-primary)' }} className="font-medium">{roomNumber}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }}>Vertical</label>
                <Badge variant="info" size="sm" className="mt-1">{vertical}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: 'var(--text-primary)' }} className="text-2xl font-semibold">
              Leave History
            </h2>

            <div className="flex items-center gap-2">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Filter by Status:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  All Statuses
                </button>
                <button
                  onClick={() => setSelectedFilter('PENDING')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedFilter === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSelectedFilter('APPROVED')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedFilter === 'APPROVED'
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  Approved
                </button>
                <button
                  onClick={() => setSelectedFilter('REJECTED')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedFilter === 'REJECTED'
                      ? 'bg-red-100 text-red-800 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  Rejected
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading leave requests...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center rounded-lg" style={{ background: 'var(--color-red-50)' }}>
              <p className="font-medium" style={{ color: 'var(--color-red-700)' }}>{error}</p>
            </div>
          ) : (
          <div className="card rounded-lg overflow-hidden" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Leave Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Applied On
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Notification
                    </th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => {
                    const typeInfo = getLeaveTypeInfo(leave.type);
                    return (
                      <tr key={leave.id} className="border-b hover:bg-gray-50" style={{ borderColor: 'var(--border-primary)' }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeInfo.icon}</span>
                            <span style={{ color: 'var(--text-primary)' }} className="font-medium capitalize">
                              {typeInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                          <div>
                            <div>{leave.fromDate}</div>
                            {leave.fromTime && (
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {leave.fromTime}
                              </div>
                            )}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>→</div>
                          <div>
                            <div>{leave.toDate}</div>
                            {leave.toTime && (
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {leave.toTime}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                          {leave.fromDate === leave.toDate ? '1 day' : `${Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days`}
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
                        <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                          {leave.appliedDate}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {leave.superintendentRemarks && (
                              <div style={{ color: 'var(--text-secondary)' }}>
                                {leave.superintendentRemarks}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                Notified: {leave.parentNotified ? 'Yes' : 'No'}
                              </span>
                              {leave.parentNotified && !leave.parentAcknowledged && (
                                <span className="text-xs" style={{ color: 'var(--color-gold-600)' }}>
                                  (Awaiting Ack)
                                </span>
                              )}
                              {leave.parentAcknowledged && (
                                <span className="text-xs" style={{ color: 'var(--color-green-600)' }}>
                                  ✓ Acknowledged
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {leave.status === 'PENDING' && leave.parentNotified && !leave.parentAcknowledged && (
                            <button
                              onClick={() => handleAcknowledge(leave.id)}
                              className="px-3 py-1.5 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                              style={{
                                background: 'var(--color-green-100)',
                                color: 'var(--color-green-800)'
                              }}
                            >
                              Acknowledge
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredLeaves.length === 0 && (
              <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">No leave requests found</h3>
                <p>Try adjusting your filter or check back later</p>
              </div>
            )}

            <div className="card p-6 rounded-lg" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">📢</span>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Communication with Hostel Administration
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    For any questions about your ward's leave requests or to request special considerations,
                    please contact hostel administration directly.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 text-sm">
                <div>
                  <label style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">+91 22 2414 1234</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)' }}>Email</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">superintendant@shgjaintrust.org</p>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)' }}>Office Hours</label>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">Monday to Saturday: 9:00 AM to 6:00 PM IST</p>
                </div>
              </div>
            </div>

            <div className="card p-4 rounded-lg text-xs" style={{ background: 'var(--color-blue-50)', borderLeft: '4px solid var(--color-blue-500)' }}>
              <p style={{ color: 'var(--text-primary)' }} className="font-medium mb-2">
                Data Protection & Privacy (DPDP) Compliance Notice
              </p>
              <ul style={{ color: 'var(--text-secondary)' }} className="space-y-1">
                <li>• This dashboard displays your ward's information in compliance with DPDP Act, 2023</li>
                <li>• All leave requests and decisions are logged for audit purposes</li>
                <li>• Parent acknowledgment of notifications is recorded for transparency</li>
                <li>• Data is transmitted encrypted and stored securely with restricted access</li>
              </ul>
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
