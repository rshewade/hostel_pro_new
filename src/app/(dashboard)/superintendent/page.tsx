'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/feedback/Modal';
import { Table } from '@/components/data/Table';
import { SendMessagePanel, type SendMessageData, DEFAULT_TEMPLATES } from '@/components/communication/SendMessagePanel';
import type { TableColumn } from '@/components/types';
import { cn } from '@/components/utils';
import { Spinner } from '@/components/feedback/Spinner';

// Types
type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
type Vertical = 'BOYS' | 'GIRLS' | 'DHARAMSHALA';

interface ApplicationDocument {
  type: string;
  documentType: string;
  dbDocumentType: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  bucketId: string;
}

interface InterviewDetails {
  scheduleTime: string | null;
  mode: string | null;
}

interface Application {
  id: string;
  trackingNumber: string;
  applicantName: string;
  vertical: Vertical;
  status: ApplicationStatus;
  applicationDate: string;
  paymentStatus: string;
  interviewScheduled: boolean;
  interview?: InterviewDetails;
  flags?: string[];
  email?: string;
  mobile?: string;
  documents?: ApplicationDocument[];
}


export default function SuperintendentDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [selectedVertical, setSelectedVertical] = useState<Vertical | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // API data state
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch applications from API
  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const result = await response.json();
      // Handle wrapped response format: { success: true, data: [...] }
      const data = result.data || result;

      // Transform API data to UI format
      const transformedApplications: Application[] = Array.isArray(data) ? data.map((app: any) => {
        // Extract applicant name from different formats (check snake_case first as that's the DB format)
        let applicantName = 'Unknown';
        if (app.applicant_name) {
          applicantName = app.applicant_name;
        } else if (app.applicantName) {
          applicantName = app.applicantName;
        } else if (app.firstName) {
          applicantName = `${app.firstName} ${app.lastName || ''}`.trim();
        } else if (app.data?.personal_info?.full_name) {
          applicantName = app.data.personal_info.full_name;
        } else if (app.data?.personalInfo?.fullName) {
          applicantName = app.data.personalInfo.fullName;
        }

        return {
          id: app.id,
          trackingNumber: app.trackingNumber || app.tracking_number || `HG-${new Date().getFullYear()}-00000`,
          applicantName,
          vertical: mapVertical(app.personalInfo?.vertical || app.vertical || app.data?.vertical),
          status: mapApplicationStatus(app.current_status || app.currentStatus || app.status),
          applicationDate: app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB') :
                          app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB') :
                          app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-GB') :
                          app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB') :
                          new Date().toLocaleDateString('en-GB'),
          paymentStatus: app.fees?.paymentStatus || app.paymentStatus || 'PENDING',
          interviewScheduled: app.interview?.scheduled || app.interviewScheduled || !!app.interview_scheduled_at || false,
          interview: {
            scheduleTime: app.interview_scheduled_at || app.data?.interview?.scheduled_at || null,
            mode: app.data?.interview?.mode || null,
          },
          flags: app.flags || [],
          email: app.personalInfo?.email || app.applicant_email || app.applicantEmail || app.email,
          mobile: app.personalInfo?.mobile || app.applicant_mobile || app.applicantMobile || app.mobile
        };
      }) : [];
      
      setApplications(transformedApplications);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Fetch full application details including documents
  const fetchApplicationDetails = useCallback(async (appId: string) => {
    try {
      setIsLoadingDetails(true);
      const response = await fetch(`/api/applications/${appId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application details');
      }
      const result = await response.json();
      const appData = result.data || result;

      // Extract documents from the application data
      const documents: ApplicationDocument[] = appData.data?.documents || [];

      // Extract interview details
      const interview: InterviewDetails = {
        scheduleTime: appData.interview_scheduled_at || appData.data?.interview?.scheduled_at || null,
        mode: appData.data?.interview?.mode || null,
      };

      return { documents, interview };
    } catch (err) {
      console.error('Error fetching application details:', err);
      return { documents: [], interview: { scheduleTime: null, mode: null } };
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Handle viewing an application - fetch full details
  const handleViewApplication = useCallback(async (app: Application) => {
    setSelectedApplication(app);
    const { documents, interview } = await fetchApplicationDetails(app.id);
    setSelectedApplication(prev => prev ? { ...prev, documents, interview } : null);
  }, [fetchApplicationDetails]);

  // Get signed URL for viewing a document
  const getDocumentUrl = async (storagePath: string, bucketId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/applications/documents/url?path=${encodeURIComponent(storagePath)}&bucket=${encodeURIComponent(bucketId)}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.url || null;
    } catch (err) {
      console.error('Error getting document URL:', err);
      return null;
    }
  };

  // View document in new tab
  const handleViewDocument = async (doc: ApplicationDocument) => {
    const url = await getDocumentUrl(doc.storagePath, doc.bucketId);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Failed to get document URL');
    }
  };

  // Communication state (for sending messages to applicants)
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  const [selectedMessageRecipient, setSelectedMessageRecipient] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Action confirmation modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'forward';
    application: Application | null;
    remarks: string;
  }>({
    isOpen: false,
    type: 'approve',
    application: null,
    remarks: ''
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Status mapping functions
  const mapApplicationStatus = (status: string): ApplicationStatus => {
    const statusMap: Record<string, ApplicationStatus> = {
      'DRAFT': 'DRAFT',
      'SUBMITTED': 'SUBMITTED',
      'REVIEW': 'REVIEW',
      'UNDER_REVIEW': 'REVIEW',
      'NEW': 'SUBMITTED',
      'APPROVED': 'APPROVED',
      'REJECTED': 'REJECTED',
      'ARCHIVED': 'ARCHIVED',
      'INTERVIEW': 'REVIEW'
    };
    return statusMap[status] || 'DRAFT';
  };

  const mapVertical = (vertical: string): Vertical => {
    const verticalMap: Record<string, Vertical> = {
      'BOYS': 'BOYS',
      'BOYS_HOSTEL': 'BOYS',
      'GIRLS': 'GIRLS',
      'GIRLS_ASHRAM': 'GIRLS',
      'DHARAMSHALA': 'DHARAMSHALA'
    };
    return verticalMap[vertical] || 'BOYS';
  };

  // Filter applications from API data
  const filteredApplications = applications.filter(app => {
    const matchesStatus = selectedStatus === 'ALL' || app.status === selectedStatus;
    const matchesVertical = selectedVertical === 'ALL' || app.vertical === selectedVertical;
    const matchesSearch = app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       app.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesVertical && matchesSearch;
  });

  // Status badge variants
  const getStatusVariant = (status: ApplicationStatus): BadgeVariant => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED':
      case 'REVIEW': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'ARCHIVED': return 'default';
      default: return 'default';
    }
  };

  const handleSendMessage = async (data: SendMessageData) => {
    setIsSending(true);
    try {
      // TODO: Implement actual message sending via API
      console.log('Sending message:', data);
      // In a real implementation, this would call the communications API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Table columns
  const columns: TableColumn<Application>[] = [
    {
      key: 'applicantName',
      header: 'Applicant Name',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-xs">{value}</span>
      )
    },
    {
      key: 'vertical',
      header: 'Vertical',
      sortable: true,
      render: (value: Vertical) => (
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          value === 'BOYS' && 'bg-blue-100 text-blue-700',
          value === 'GIRLS' && 'bg-pink-100 text-pink-700',
          value === 'DHARAMSHALA' && 'bg-yellow-100 text-yellow-700'
        )}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: ApplicationStatus) => (
        <Badge variant={getStatusVariant(value)} size="sm">
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      sortable: true,
      render: (value: string) => (
        <Badge
          variant={value === 'PAID' ? 'success' : value === 'PENDING' ? 'warning' : 'error'}
          size="sm"
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'interviewScheduled',
      header: 'Interview',
      render: (value: boolean) => (
        <Badge
          variant={value ? 'success' : 'default'}
          size="sm"
          rounded={true}
        >
          {value ? 'Scheduled' : 'Not Scheduled'}
        </Badge>
      )
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (value: string[]) => (
        <div className="flex gap-1">
          {value && value.length > 0 && value.map((flag, index) => (
            <Chip
              key={index}
              variant="warning"
              size="sm"
            >
              {flag}
            </Chip>
          ))}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: Application) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleViewApplication(row)}
          >
            Review
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewApplication(row)}
          >
            View Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Title */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Applications
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Review and manage hostel admission applications
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}>
          {selectedVertical === 'ALL' ? 'All Verticals' : selectedVertical}
        </span>
      </div>

      {/* Applications Content */}
      <div>
            {/* Filters - Enhanced with Filter Chips */}
            <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
              <div className="flex flex-col gap-4">
                {/* Vertical Filter Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm font-medium mr-2" style={{ color: 'var(--text-secondary)' }}>
                    Vertical:
                  </label>
                  <button
                    onClick={() => setSelectedVertical('ALL')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                      selectedVertical === 'ALL'
                        ? 'border-navy-900 bg-navy-900 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    )}
                  >
                    All Verticals
                  </button>
                  <button
                    onClick={() => setSelectedVertical('BOYS')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                      selectedVertical === 'BOYS'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-blue-300 text-blue-700 hover:border-blue-400'
                    )}
                  >
                    Boys Hostel
                  </button>
                  <button
                    onClick={() => setSelectedVertical('GIRLS')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                      selectedVertical === 'GIRLS'
                        ? 'border-pink-600 bg-pink-600 text-white'
                        : 'border-pink-300 text-pink-700 hover:border-pink-400'
                    )}
                  >
                    Girls Ashram
                  </button>
                  <button
                    onClick={() => setSelectedVertical('DHARAMSHALA')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                      selectedVertical === 'DHARAMSHALA'
                        ? 'border-yellow-600 bg-yellow-600 text-white'
                        : 'border-yellow-300 text-yellow-700 hover:border-yellow-400'
                    )}
                  >
                    Dharamshala
                  </button>
                </div>

                {/* Status Filter Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm font-medium mr-2" style={{ color: 'var(--text-secondary)' }}>
                    Status:
                  </label>
                  <button
                    onClick={() => setSelectedStatus('ALL')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                      selectedStatus === 'ALL'
                        ? 'border-navy-900 bg-navy-900 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    )}
                  >
                    All Statuses
                  </button>
                    <button
                      onClick={() => setSelectedStatus('SUBMITTED')}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                        selectedStatus === 'SUBMITTED'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-blue-200 text-blue-700 hover:border-blue-300'
                      )}
                    >
                      New
                    </button>
                    <button
                      onClick={() => setSelectedStatus('REVIEW')}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                        selectedStatus === 'REVIEW'
                          ? 'border-yellow-500 bg-yellow-500 text-white'
                          : 'border-yellow-200 text-yellow-700 hover:border-yellow-300'
                      )}
                    >
                      Under Review
                    </button>
                  <button
                    onClick={() => setSelectedStatus('APPROVED')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                      selectedStatus === 'APPROVED'
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-green-200 text-green-700 hover:border-green-300'
                    )}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setSelectedStatus('REJECTED')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                      selectedStatus === 'REJECTED'
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-red-200 text-red-700 hover:border-red-300'
                    )}
                  >
                    Rejected
                  </button>
                </div>

                {/* Search and Clear */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Search:
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name or tracking #"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-gold-500"
                      style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Clear Filters */}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchApplications}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Applications Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
                <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading applications...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg border" style={{ background: 'var(--color-red-50)', borderColor: 'var(--color-red-200)' }}>
                <p style={{ color: 'var(--color-red-700)' }} className="font-medium">Error loading applications</p>
                <p style={{ color: 'var(--color-red-600)' }} className="text-sm">{error}</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-3"
                  onClick={fetchApplications}
                >
                  Retry
                </Button>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-12 text-center rounded-lg" style={{ background: 'var(--surface-primary)' }}>
                <p className="text-gray-600 mb-2">No applications found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <Table<Application>
                data={filteredApplications}
                columns={columns}
                onRowClick={(row) => handleViewApplication(row)}
                pagination={{
                  currentPage: 1,
                  pageSize: 10,
                  totalItems: filteredApplications.length,
                  totalPages: Math.ceil(filteredApplications.length / 10),
                  onPageChange: (page) => console.log('Page change:', page)
                }}
                density="normal"
                striped={true}
              />
            )}
          </div>

      {/* Application Detail Modal */}
      <Modal
        isOpen={selectedApplication !== null}
        onClose={() => setSelectedApplication(null)}
        title="Application Details"
        size="xl"
      >
        {selectedApplication && (
          <div className="space-y-6">
            {/* Applicant Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Applicant Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedApplication.applicantName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tracking Number</label>
                  <p className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedApplication.trackingNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Vertical</label>
                  <Badge
                    variant={selectedApplication.vertical === 'BOYS' ? 'success' : selectedApplication.vertical === 'GIRLS' ? 'warning' : 'info'}
                    size="md"
                  >
                    {selectedApplication.vertical}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Application Date</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedApplication.applicationDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Status & Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Application Status</label>
                <Badge
                  variant={getStatusVariant(selectedApplication.status)}
                  size="md"
                  className="mt-2"
                >
                  {selectedApplication.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-gray-600">Payment Status</label>
                <Badge
                  variant={selectedApplication.paymentStatus === 'PAID' ? 'success' : selectedApplication.paymentStatus === 'PENDING' ? 'warning' : 'error'}
                  size="md"
                  className="mt-2"
                >
                  {selectedApplication.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* Interview Details */}
            {selectedApplication.interviewScheduled && selectedApplication.interview?.scheduleTime && (
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Interview Scheduled
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-gray-600">Date</label>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {new Date(selectedApplication.interview.scheduleTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Time</label>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {new Date(selectedApplication.interview.scheduleTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                    </p>
                  </div>
                  {selectedApplication.interview.mode && (
                    <div>
                      <label className="text-sm text-gray-600">Mode</label>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {selectedApplication.interview.mode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flags */}
            {selectedApplication.flags && selectedApplication.flags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Flags
                </h4>
                <div className="flex gap-2">
                  {selectedApplication.flags.map((flag, index) => (
                    <Chip
                      key={index}
                      variant="warning"
                      size="sm"
                    >
                      {flag}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Preview */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Uploaded Documents
              </h4>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">Loading documents...</span>
                </div>
              ) : selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {selectedApplication.documents.map((doc, index) => {
                    const docTypeLabels: Record<string, string> = {
                      'photoFile': 'Passport Photo',
                      'birthCertificate': 'Birth Certificate',
                      'marksheet': 'Academic Marksheet',
                      'recommendationLetter': 'Recommendation Letter',
                      'PHOTOGRAPH': 'Passport Photo',
                      'BIRTH_CERTIFICATE': 'Birth Certificate',
                      'EDUCATION_CERTIFICATE': 'Academic Document',
                      'OTHER': 'Other Document',
                    };
                    const label = docTypeLabels[doc.type] || docTypeLabels[doc.dbDocumentType] || doc.type;
                    const fileExt = doc.originalFileName?.split('.').pop()?.toUpperCase() || 'PDF';
                    const fileSize = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : 'Unknown';

                    return (
                      <div
                        key={index}
                        className="p-4 rounded border cursor-pointer hover:shadow-md transition-shadow"
                        style={{ borderColor: 'var(--border-gray-200)', background: 'var(--bg-page)' }}
                        onClick={() => handleViewDocument(doc)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{fileExt === 'PDF' ? '📄' : '🖼️'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                              {label}
                            </p>
                            <p className="text-xs text-gray-600">{fileExt} • {fileSize}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded border text-center" style={{ borderColor: 'var(--border-gray-200)', background: 'var(--bg-page)' }}>
                  <p className="text-sm text-gray-500">No documents uploaded yet</p>
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Internal Notes (Superintendent Remarks)
              </h4>
              <textarea
                placeholder="Add internal remarks..."
                className="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 min-h-[100px]"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-gray-200)' }}>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    setActionModal({
                      isOpen: true,
                      type: 'approve',
                      application: selectedApplication,
                      remarks: ''
                    });
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setActionModal({
                      isOpen: true,
                      type: 'reject',
                      application: selectedApplication,
                      remarks: ''
                    });
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActionModal({
                      isOpen: true,
                      type: 'forward',
                      application: selectedApplication,
                      remarks: ''
                    });
                  }}
                >
                  Forward to Trustees
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedMessageRecipient(selectedApplication.id);
                  setShowMessagePanel(true);
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: 'approve', application: null, remarks: '' })}
        title={
          actionModal.type === 'approve' ? 'Approve Application' :
          actionModal.type === 'reject' ? 'Reject Application' : 'Forward to Trustees'
        }
        size="md"
        variant={actionModal.type === 'reject' ? 'destructive' : 'confirmation'}
        onConfirm={async () => {
          if (!actionModal.application) return;
          
          setIsActionLoading(true);
          try {
            const newStatus = actionModal.type === 'approve' ? 'APPROVED' : 
                              actionModal.type === 'reject' ? 'REJECTED' : 
                              'REVIEW';
            
            const response = await fetch(`/api/applications/${actionModal.application.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: newStatus,
                current_status: newStatus,
                remarks: actionModal.remarks
              })
            });

            if (response.ok) {
              await fetchApplications();
              setActionModal({ isOpen: false, type: 'approve', application: null, remarks: '' });
              setSelectedApplication(null);
              alert(`Application ${actionModal.type === 'approve' ? 'approved' : actionModal.type === 'reject' ? 'rejected' : 'forwarded'} successfully`);
            } else {
              alert('Failed to update application status');
            }
          } catch (err) {
            console.error('Error updating application:', err);
            alert('Failed to update application status');
          } finally {
            setIsActionLoading(false);
          }
        }}
        confirmText={actionModal.type === 'approve' ? 'Approve' : actionModal.type === 'reject' ? 'Reject' : 'Forward'}
        confirmLoading={isActionLoading}
      >
        {actionModal.application && (
          <div className="space-y-4">
            {/* Application Summary */}
            <div className="p-4 rounded border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-gray-200)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-600">Applicant Name</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {actionModal.application.applicantName}
                  </p>
                </div>
                <div>
                  <label className="text-gray-600">Tracking Number</label>
                  <p className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                    {actionModal.application.trackingNumber}
                  </p>
                </div>
                <div>
                  <label className="text-gray-600">Vertical</label>
                  <Badge
                    variant={actionModal.application.vertical === 'BOYS' ? 'success' : actionModal.application.vertical === 'GIRLS' ? 'warning' : 'info'}
                    size="sm"
                    className="mt-1"
                  >
                    {actionModal.application.vertical}
                  </Badge>
                </div>
                <div>
                  <label className="text-gray-600">Current Status</label>
                  <Badge
                    variant={getStatusVariant(actionModal.application.status)}
                    size="sm"
                    className="mt-1"
                  >
                    {actionModal.application.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Payment Status Warning */}
              {actionModal.application.paymentStatus !== 'PAID' && (
                <div className="mt-4 p-3 rounded border-l-4" style={{
                  background: 'var(--color-yellow-50)',
                  borderColor: 'var(--color-yellow-500)'
                }}>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div>
                      <p className="font-medium text-yellow-800">Payment Status: {actionModal.application.paymentStatus}</p>
                      <p className="text-sm text-yellow-700">
                        Consider payment status before proceeding with this action.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Remarks Field */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionModal.remarks}
                onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                placeholder={actionModal.type === 'approve'
                  ? 'Enter approval remarks (e.g., Documents verified, interview completed successfully)'
                  : actionModal.type === 'reject'
                  ? 'Enter rejection reason (e.g., Incomplete documents,不符合条件)'
                  : 'Enter remarks for trustees (e.g., Recommendation, additional notes)'
                }
                className="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 min-h-[100px]"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Remarks will be recorded in the audit trail and visible to other superintendents.
              </p>
            </div>

            {/* Vertical Context Warning */}
            {selectedVertical !== 'ALL' && actionModal.application.vertical !== selectedVertical && (
              <div className="p-3 rounded border-l-4" style={{
                background: 'var(--color-red-50)',
                borderColor: 'var(--color-red-500)'
              }}>
                <div className="flex items-start gap-2">
                  <span className="text-red-600">🚨</span>
                  <div>
                    <p className="font-medium text-red-800">Cross-Vertical Action Warning</p>
                    <p className="text-sm text-red-700">
                      You are currently viewing <strong>{selectedVertical}</strong> applications but attempting to take action on a <strong>{actionModal.application.vertical}</strong> application.
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Please verify this is intentional before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
        recipients={applications.map(app => ({
          id: app.id,
          name: app.applicantName,
          role: 'applicant' as const,
          phone: app.mobile || '',
          email: app.email || ''
        }))}
        templates={DEFAULT_TEMPLATES}
        defaultRecipientId={selectedMessageRecipient || undefined}
        context={selectedApplication ? {
          trackingNumber: selectedApplication.trackingNumber,
          status: selectedApplication.status,
          vertical: selectedApplication.vertical
        } : undefined}
        isLoading={isSending}
        showContextWarning={!!selectedApplication}
      />
    </div>
  );
}
