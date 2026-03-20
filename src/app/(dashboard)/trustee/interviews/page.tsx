'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/data/Table';
import { Modal } from '@/components/feedback/Modal';
import { Spinner } from '@/components/feedback/Spinner';
import type { TableColumn } from '@/components/types';
import { cn } from '@/components/utils';
import { CalendarDays, Video, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
type InterviewMode = 'ONLINE' | 'PHYSICAL';
type Vertical = 'BOYS' | 'GIRLS' | 'DHARAMSHALA';

interface Interview {
  id: string;
  applicationId: string;
  applicantName: string;
  trackingNumber: string;
  vertical: Vertical;
  scheduledDate: string;
  scheduledTime: string;
  mode: InterviewMode;
  meetingLink?: string;
  location?: string;
  status: InterviewStatus;
  score?: number;
  notes?: string;
}

interface EvaluationForm {
  academicBackground: { score: number; comments: string };
  communicationSkills: { score: number; comments: string };
  discipline: { score: number; comments: string };
  motivation: { score: number; comments: string };
  overallScore: number;
  overallObservations: string;
  recommendation: 'APPROVE' | 'REJECT' | 'DEFERRED';
}

export default function TrusteeInterviews() {
  const [selectedStatus, setSelectedStatus] = useState<InterviewStatus | 'ALL'>('ALL');
  const [selectedVertical, setSelectedVertical] = useState<Vertical | 'ALL'>('ALL');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm>({
    academicBackground: { score: 0, comments: '' },
    communicationSkills: { score: 0, comments: '' },
    discipline: { score: 0, comments: '' },
    motivation: { score: 0, comments: '' },
    overallScore: 0,
    overallObservations: '',
    recommendation: 'APPROVE',
  });
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch applications with interview status
      const response = await fetch('/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }
      const data = await response.json();
      const applications = Array.isArray(data) ? data : [];

      // Filter and transform to interviews
      const interviewList: Interview[] = applications
        .filter((app: any) => {
          const status = app.status || app.currentStatus;
          return status === 'INTERVIEW_SCHEDULED' || status === 'INTERVIEW_COMPLETED';
        })
        .map((app: any) => {
          let applicantName = 'Unknown';
          if (app.firstName) {
            applicantName = `${app.firstName} ${app.lastName || ''}`.trim();
          } else if (app.data?.personal_info?.full_name) {
            applicantName = app.data.personal_info.full_name;
          }

          const status = app.status || app.currentStatus;
          return {
            id: `int-${app.id}`,
            applicationId: app.id,
            applicantName,
            trackingNumber: app.trackingNumber || app.tracking_number || app.id,
            vertical: (app.vertical || 'BOYS').toUpperCase() as Vertical,
            scheduledDate: new Date().toLocaleDateString('en-GB'),
            scheduledTime: '10:00 AM',
            mode: 'ONLINE' as InterviewMode,
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            status: status === 'INTERVIEW_COMPLETED' ? ('COMPLETED' as InterviewStatus) : ('SCHEDULED' as InterviewStatus),
          };
        });

      setInterviews(interviewList);
    } catch (err: any) {
      setError(err.message || 'Failed to load interviews');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const filteredInterviews = interviews.filter((interview) => {
    const matchesStatus = selectedStatus === 'ALL' || interview.status === selectedStatus;
    const matchesVertical = selectedVertical === 'ALL' || interview.vertical === selectedVertical;
    return matchesStatus && matchesVertical;
  });

  const getStatusVariant = (status: InterviewStatus): BadgeVariant => {
    switch (status) {
      case 'SCHEDULED':
        return 'warning';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'MISSED':
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleJoinInterview = (interview: Interview) => {
    setJoinError(null);
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank');
    } else {
      setJoinError('No meeting link available for this interview');
    }
  };

  const handleOpenEvaluation = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowEvaluationModal(true);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedInterview) return;

    setIsSavingEvaluation(true);
    setEvaluationError(null);
    try {
      const response = await fetch(`/api/applications/${selectedInterview.applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'INTERVIEW_COMPLETED',
          current_status: 'INTERVIEW_COMPLETED',
          interview_evaluation: evaluationForm,
        }),
      });

      if (response.ok) {
        await fetchInterviews();
        setShowEvaluationModal(false);
        setSelectedInterview(null);
        setEvaluationForm({
          academicBackground: { score: 0, comments: '' },
          communicationSkills: { score: 0, comments: '' },
          discipline: { score: 0, comments: '' },
          motivation: { score: 0, comments: '' },
          overallScore: 0,
          overallObservations: '',
          recommendation: 'APPROVE',
        });
      } else {
        throw new Error('Failed to save evaluation');
      }
    } catch {
      setEvaluationError('Failed to save evaluation. Please try again.');
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  const columns: TableColumn<Interview>[] = [
    {
      key: 'applicantName',
      header: 'Applicant',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      render: (value: string) => <span className="font-mono text-xs">{value}</span>,
    },
    {
      key: 'vertical',
      header: 'Vertical',
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
      key: 'scheduledDate',
      header: 'Date & Time',
      render: (_: string, row: Interview) => (
        <div>
          <div className="text-sm font-medium">{row.scheduledDate}</div>
          <div className="text-xs text-gray-500">{row.scheduledTime}</div>
        </div>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (value: InterviewMode) => (
        <div className="flex items-center gap-1">
          {value === 'ONLINE' ? (
            <Video className="w-4 h-4 text-blue-600" />
          ) : (
            <MapPin className="w-4 h-4 text-green-600" />
          )}
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: InterviewStatus) => (
        <Badge variant={getStatusVariant(value)} size="sm">
          {value.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: Interview) => (
        <div className="flex gap-2">
          {row.status === 'SCHEDULED' && (
            <>
              <Button variant="primary" size="sm" onClick={() => handleJoinInterview(row)}>
                Join
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleOpenEvaluation(row)}>
                Complete
              </Button>
            </>
          )}
          {row.status === 'COMPLETED' && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedInterview(row)}>
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>
          Loading interviews...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border" style={{ background: 'var(--color-red-50)', borderColor: 'var(--color-red-200)' }}>
        <p className="font-medium text-red-700">Error loading interviews</p>
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={fetchInterviews}>
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
            Interviews
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage interview schedules and evaluations
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchInterviews}>
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {interviews.filter((i) => i.status === 'SCHEDULED').length}
              </p>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {interviews.filter((i) => i.status === 'COMPLETED').length}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {interviews.filter((i) => i.status === 'MISSED' || i.status === 'CANCELLED').length}
              </p>
              <p className="text-sm text-gray-500">Missed/Cancelled</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {interviews.length}
              </p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Status:
            </label>
            {(['ALL', 'SCHEDULED', 'COMPLETED', 'MISSED'] as const).map((status) => (
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
                {status === 'ALL' ? 'All' : status}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Vertical:
            </label>
            {(['ALL', 'BOYS', 'GIRLS', 'DHARAMSHALA'] as const).map((vertical) => (
              <button
                key={vertical}
                onClick={() => setSelectedVertical(vertical)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                  selectedVertical === vertical
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                )}
              >
                {vertical === 'ALL' ? 'All' : vertical}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Join Error Display */}
      {joinError && (
        <div className="p-3 rounded border-l-4 bg-red-50 border-red-500">
          <p className="text-sm text-red-800">{joinError}</p>
        </div>
      )}

      {/* Interviews Table */}
      {filteredInterviews.length === 0 ? (
        <div className="p-12 text-center rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <CalendarDays className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No interviews found</p>
          <p className="text-sm text-gray-500">Schedule interviews from the Applications page.</p>
        </div>
      ) : (
        <Table<Interview>
          data={filteredInterviews}
          columns={columns}
          pagination={{
            currentPage: 1,
            pageSize: 10,
            totalItems: filteredInterviews.length,
            totalPages: Math.ceil(filteredInterviews.length / 10),
            onPageChange: () => {},
          }}
          density="normal"
          striped={true}
        />
      )}

      {/* Evaluation Modal */}
      <Modal
        isOpen={showEvaluationModal}
        onClose={() => {
          setShowEvaluationModal(false);
          setSelectedInterview(null);
        }}
        title="Interview Evaluation"
        size="lg"
      >
        {selectedInterview && (
          <div className="space-y-6">
            <div className="p-3 rounded bg-blue-50 mb-4">
              <p className="font-medium">{selectedInterview.applicantName}</p>
              <p className="text-sm text-gray-600">{selectedInterview.trackingNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(['academicBackground', 'communicationSkills', 'discipline', 'motivation'] as const).map((criterion) => (
                <div key={criterion}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {criterion.replace(/([A-Z])/g, ' $1').trim()} (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={evaluationForm[criterion].score}
                    onChange={(e) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        [criterion]: {
                          ...evaluationForm[criterion],
                          score: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                  <textarea
                    value={evaluationForm[criterion].comments}
                    onChange={(e) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        [criterion]: {
                          ...evaluationForm[criterion],
                          comments: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 mt-2 min-h-[60px]"
                    placeholder="Comments..."
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Overall Score (1-20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={evaluationForm.overallScore}
                  onChange={(e) =>
                    setEvaluationForm({ ...evaluationForm, overallScore: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recommendation</label>
                <select
                  value={evaluationForm.recommendation}
                  onChange={(e) =>
                    setEvaluationForm({
                      ...evaluationForm,
                      recommendation: e.target.value as 'APPROVE' | 'REJECT' | 'DEFERRED',
                    })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="APPROVE">Approve</option>
                  <option value="DEFERRED">Deferred</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Overall Observations</label>
              <textarea
                value={evaluationForm.overallObservations}
                onChange={(e) => setEvaluationForm({ ...evaluationForm, overallObservations: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 min-h-[80px]"
                placeholder="Overall observations and recommendations..."
              />
            </div>

            {/* Evaluation Error */}
            {evaluationError && (
              <div className="p-3 rounded border-l-4 bg-red-50 border-red-500">
                <p className="text-sm text-red-800">{evaluationError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="primary" onClick={handleSaveEvaluation} loading={isSavingEvaluation}>
                Save Evaluation
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEvaluationModal(false);
                  setSelectedInterview(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
