'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/data/Table';
import { Spinner } from '@/components/feedback/Spinner';
import type { TableColumn } from '@/components/types';
import { cn } from '@/components/utils';
import {
  ApplicationReviewModal,
  InterviewScheduleModal,
  type Application,
  type ApplicationStatus,
  type Vertical,
} from '../_components';

export default function TrusteeApplications() {
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'FORWARDED' | 'PROVISIONALLY_APPROVED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED'>('ALL');
  const [selectedVertical, setSelectedVertical] = useState<Vertical | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewApplication, setInterviewApplication] = useState<Application | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await response.json();

      const transformedApplications: Application[] = (Array.isArray(data) ? data : []).map((app: any) => {
        let applicantName = 'Unknown';
        if (app.firstName) {
          applicantName = `${app.firstName} ${app.lastName || ''}`.trim();
        } else if (app.data?.personal_info?.full_name) {
          applicantName = app.data.personal_info.full_name;
        }

        let status: ApplicationStatus = 'SUBMITTED';
        const appStatus = app.status || app.currentStatus || app.current_status;
        if (appStatus === 'REVIEW' || appStatus === 'FORWARDED') {
          status = 'FORWARDED';
        } else if (appStatus === 'PROVISIONALLY_APPROVED') {
          status = 'PROVISIONALLY_APPROVED';
        } else if (appStatus === 'INTERVIEW_SCHEDULED') {
          status = 'INTERVIEW_SCHEDULED';
        } else if (appStatus === 'INTERVIEW_COMPLETED') {
          status = 'INTERVIEW_COMPLETED';
        } else if (appStatus === 'APPROVED') {
          status = 'APPROVED';
        } else if (appStatus === 'REJECTED') {
          status = 'REJECTED';
        }

        return {
          id: app.id,
          trackingNumber: app.trackingNumber || app.tracking_number || app.id,
          applicantName,
          vertical: (app.vertical || 'BOYS').toUpperCase().replace('-HOSTEL', '').replace('_', '') as Vertical,
          status,
          applicationDate: app.createdAt
            ? new Date(app.createdAt).toLocaleDateString('en-GB')
            : new Date().toLocaleDateString('en-GB'),
          paymentStatus: app.paymentStatus || 'PAID',
          interviewScheduled: status === 'INTERVIEW_SCHEDULED' || status === 'INTERVIEW_COMPLETED',
          flags: app.flags || [],
          forwardedBy: app.remarks
            ? {
                superintendentId: 'u2',
                superintendentName: 'Superintendent',
                forwardedOn: new Date().toLocaleDateString('en-GB'),
                recommendation: 'RECOMMEND' as const,
                remarks: app.remarks,
              }
            : undefined,
          interview:
            status === 'INTERVIEW_SCHEDULED' || status === 'INTERVIEW_COMPLETED'
              ? {
                  id: 'int-1',
                  scheduledDate: new Date().toLocaleDateString('en-GB'),
                  scheduledTime: '10:00 AM',
                  mode: 'ONLINE' as const,
                  status: status === 'INTERVIEW_SCHEDULED' ? ('SCHEDULED' as const) : ('COMPLETED' as const),
                }
              : undefined,
        };
      });

      setApplications(transformedApplications);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    const matchesStatus =
      selectedStatus === 'ALL' ||
      app.status === selectedStatus ||
      (selectedStatus === 'FORWARDED' && (app.status === 'FORWARDED' || app.status === 'REVIEW'));
    const matchesVertical = selectedVertical === 'ALL' || app.vertical === selectedVertical;
    const matchesSearch =
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesVertical && matchesSearch;
  });

  const getStatusVariant = (status: ApplicationStatus): BadgeVariant => {
    switch (status) {
      case 'FORWARDED':
        return 'info';
      case 'PROVISIONALLY_APPROVED':
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_COMPLETED':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleProvisionalApprove = async (applicationId: string, requiresInterview: boolean, remarks: string) => {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'PROVISIONALLY_APPROVED',
        current_status: 'PROVISIONALLY_APPROVED',
        remarks,
        requires_interview: requiresInterview,
      }),
    });
    if (response.ok) {
      await fetchApplications();
    } else {
      throw new Error('Failed to approve application');
    }
  };

  const handleProvisionalReject = async (applicationId: string, remarks: string) => {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REJECTED',
        current_status: 'REJECTED',
        remarks,
      }),
    });
    if (response.ok) {
      await fetchApplications();
    } else {
      throw new Error('Failed to reject application');
    }
  };

  const handleFinalApprove = async (applicationId: string, remarks: string) => {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        current_status: 'APPROVED',
        remarks,
      }),
    });
    if (response.ok) {
      await fetchApplications();
    } else {
      throw new Error('Failed to approve application');
    }
  };

  const handleFinalReject = async (applicationId: string, remarks: string) => {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REJECTED',
        current_status: 'REJECTED',
        remarks,
      }),
    });
    if (response.ok) {
      await fetchApplications();
    } else {
      throw new Error('Failed to reject application');
    }
  };

  const handleScheduleInterview = async (data: {
    applicationId: string;
    date: string;
    time: string;
    mode: 'ONLINE' | 'PHYSICAL';
    sendInvitation: boolean;
    sendReminder: boolean;
  }) => {
    const response = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: data.applicationId,
        schedule_time: `${data.date}T${data.time}:00Z`,
        mode: data.mode,
        send_invitation: data.sendInvitation,
        send_reminder: data.sendReminder,
      }),
    });

    if (response.ok) {
      await fetch(`/api/applications/${data.applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'INTERVIEW_SCHEDULED',
          current_status: 'INTERVIEW_SCHEDULED',
        }),
      });
      await fetchApplications();
    } else {
      throw new Error('Failed to schedule interview');
    }
  };

  const columns: TableColumn<Application>[] = [
    {
      key: 'applicantName',
      header: 'Applicant',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      sortable: true,
      render: (value: string) => <span className="font-mono text-xs">{value}</span>,
    },
    {
      key: 'vertical',
      header: 'Vertical',
      sortable: true,
      render: (value: Vertical) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            value === 'BOYS' && 'bg-blue-100 text-blue-700',
            value === 'GIRLS' && 'bg-pink-100 text-pink-700',
            value === 'DHARAMSHALA' && 'bg-yellow-100 text-yellow-700'
          )}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: ApplicationStatus) => (
        <Badge variant={getStatusVariant(value)} size="sm">
          {value.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'interviewScheduled',
      header: 'Interview',
      render: (value: boolean, row: Application) => (
        <Badge variant={value ? 'success' : 'default'} size="sm" rounded={true}>
          {value && row.interview ? `${row.interview.mode}` : 'Not Scheduled'}
        </Badge>
      ),
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (value: string[]) => (
        <div className="flex gap-1">
          {value &&
            value.length > 0 &&
            value.map((flag, index) => (
              <Chip key={index} variant="warning" size="sm">
                {flag}
              </Chip>
            ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: Application) => (
        <Button variant="primary" size="sm" onClick={() => setSelectedApplication(row)}>
          Review
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>
          Loading applications...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border" style={{ background: 'var(--color-red-50)', borderColor: 'var(--color-red-200)' }}>
        <p className="font-medium text-red-700">Error loading applications</p>
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={fetchApplications}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Applications
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Review forwarded applications and make decisions
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchApplications}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
        <div className="flex flex-col gap-4">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium mr-2" style={{ color: 'var(--text-secondary)' }}>
              Status:
            </label>
            {(['ALL', 'FORWARDED', 'PROVISIONALLY_APPROVED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                    selectedStatus === status
                      ? 'border-navy-900 bg-navy-900 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  )}
                >
                  {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
                </button>
              )
            )}
          </div>

          {/* Vertical Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium mr-2" style={{ color: 'var(--text-secondary)' }}>
              Vertical:
            </label>
            {(['ALL', 'BOYS', 'GIRLS', 'DHARAMSHALA'] as const).map((vertical) => (
              <button
                key={vertical}
                onClick={() => setSelectedVertical(vertical)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                  selectedVertical === vertical
                    ? vertical === 'ALL'
                      ? 'border-navy-900 bg-navy-900 text-white'
                      : vertical === 'BOYS'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : vertical === 'GIRLS'
                      ? 'border-pink-600 bg-pink-600 text-white'
                      : 'border-yellow-600 bg-yellow-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                )}
              >
                {vertical === 'ALL' ? 'All Verticals' : vertical}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by name or tracking #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-gold-500"
              style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedVertical('ALL');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <div className="p-12 text-center rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <p className="text-gray-600 mb-2">No applications found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <Table<Application>
          data={filteredApplications}
          columns={columns}
          onRowClick={(row) => setSelectedApplication(row)}
          pagination={{
            currentPage: 1,
            pageSize: 10,
            totalItems: filteredApplications.length,
            totalPages: Math.ceil(filteredApplications.length / 10),
            onPageChange: () => {},
          }}
          density="normal"
          striped={true}
        />
      )}

      {/* Application Review Modal */}
      <ApplicationReviewModal
        isOpen={selectedApplication !== null}
        onClose={() => setSelectedApplication(null)}
        application={selectedApplication}
        onProvisionalApprove={handleProvisionalApprove}
        onProvisionalReject={handleProvisionalReject}
        onFinalApprove={handleFinalApprove}
        onFinalReject={handleFinalReject}
        onScheduleInterview={(app) => {
          setInterviewApplication(app);
          setShowInterviewModal(true);
          setSelectedApplication(null);
        }}
      />

      {/* Interview Schedule Modal */}
      <InterviewScheduleModal
        isOpen={showInterviewModal}
        onClose={() => {
          setShowInterviewModal(false);
          setInterviewApplication(null);
        }}
        application={interviewApplication}
        onSchedule={handleScheduleInterview}
      />
    </div>
  );
}
