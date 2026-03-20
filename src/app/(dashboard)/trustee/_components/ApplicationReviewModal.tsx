'use client';

import { useState } from 'react';
import { Modal } from '@/components/feedback/Modal';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEW' | 'FORWARDED' | 'PROVISIONALLY_APPROVED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'APPROVED' | 'REJECTED';
export type Vertical = 'BOYS' | 'GIRLS' | 'DHARAMSHALA';
export type DecisionType = 'PROVISIONAL_APPROVE_INTERVIEW' | 'PROVISIONAL_APPROVE_NO_INTERVIEW' | 'PROVISIONAL_REJECT' | 'FINAL_APPROVE' | 'FINAL_REJECT';

export interface Application {
  id: string;
  trackingNumber: string;
  applicantName: string;
  vertical: Vertical;
  status: ApplicationStatus;
  applicationDate: string;
  paymentStatus: string;
  interviewScheduled: boolean;
  flags?: string[];
  forwardedBy?: {
    superintendentId: string;
    superintendentName: string;
    forwardedOn: string;
    recommendation: 'RECOMMEND' | 'NOT_RECOMMEND' | 'NEUTRAL';
    remarks: string;
  };
  interview?: {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    mode: 'ONLINE' | 'PHYSICAL';
    meetingLink?: string;
    location?: string;
    status: 'NOT_SCHEDULED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
    score?: number;
  };
}

interface ApplicationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onProvisionalApprove: (applicationId: string, requiresInterview: boolean, remarks: string) => Promise<void>;
  onProvisionalReject: (applicationId: string, remarks: string) => Promise<void>;
  onFinalApprove: (applicationId: string, remarks: string) => Promise<void>;
  onFinalReject: (applicationId: string, remarks: string) => Promise<void>;
  onSendMessage?: (applicationId: string) => void;
  onScheduleInterview?: (application: Application) => void;
}

export function ApplicationReviewModal({
  isOpen,
  onClose,
  application,
  onProvisionalApprove,
  onProvisionalReject,
  onFinalApprove,
  onFinalReject,
  onSendMessage,
  onScheduleInterview,
}: ApplicationReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'interview' | 'decision' | 'audit'>('summary');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDecision = async (type: DecisionType) => {
    if (!application || !decisionRemarks.trim()) {
      setError('Please provide remarks for your decision');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      switch (type) {
        case 'PROVISIONAL_APPROVE_INTERVIEW':
          await onProvisionalApprove(application.id, true, decisionRemarks);
          break;
        case 'PROVISIONAL_APPROVE_NO_INTERVIEW':
          await onProvisionalApprove(application.id, false, decisionRemarks);
          break;
        case 'PROVISIONAL_REJECT':
          await onProvisionalReject(application.id, decisionRemarks);
          break;
        case 'FINAL_APPROVE':
          await onFinalApprove(application.id, decisionRemarks);
          break;
        case 'FINAL_REJECT':
          await onFinalReject(application.id, decisionRemarks);
          break;
      }
      setDecisionRemarks('');
      onClose();
    } catch {
      setError('Failed to process decision. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!application) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${application.trackingNumber} - ${application.applicantName}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b pb-4" style={{ borderColor: 'var(--border-gray-200)' }}>
          {(['summary', 'interview', 'decision', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              className={`py-2 px-4 text-sm font-medium rounded transition-colors ${
                activeTab === tab
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Applicant Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {application.applicantName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tracking Number</label>
                  <p className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                    {application.trackingNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Vertical</label>
                  <Badge
                    variant={application.vertical === 'BOYS' ? 'success' : application.vertical === 'GIRLS' ? 'warning' : 'info'}
                    size="md"
                  >
                    {application.vertical}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Application Date</label>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {application.applicationDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Application Status</label>
                <Badge variant={getStatusVariant(application.status)} size="md" className="mt-2">
                  {application.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-gray-600">Payment Status</label>
                <Badge
                  variant={application.paymentStatus === 'PAID' ? 'success' : application.paymentStatus === 'PENDING' ? 'warning' : 'error'}
                  size="md"
                  className="mt-2"
                >
                  {application.paymentStatus}
                </Badge>
              </div>
            </div>

            {application.forwardedBy && (
              <div className="p-4 rounded border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-gray-200)' }}>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Superintendent Review
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forwarded By:</span>
                    <span className="font-medium">{application.forwardedBy.superintendentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forwarded On:</span>
                    <span className="font-medium">{application.forwardedBy.forwardedOn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Recommendation:</span>
                    <Badge
                      variant={
                        application.forwardedBy.recommendation === 'RECOMMEND'
                          ? 'success'
                          : application.forwardedBy.recommendation === 'NOT_RECOMMEND'
                          ? 'error'
                          : 'info'
                      }
                      size="sm"
                    >
                      {application.forwardedBy.recommendation}
                    </Badge>
                  </div>
                  {application.forwardedBy.remarks && (
                    <div>
                      <span className="text-gray-600">Remarks:</span>
                      <p className="mt-1 font-medium">{application.forwardedBy.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {application.flags && application.flags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Flags</h4>
                <div className="flex gap-2">
                  {application.flags.map((flag, index) => (
                    <Chip key={index} variant="warning" size="sm">
                      {flag}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-gray-200)' }}>
              <div className="flex gap-3">
                {application.status === 'FORWARDED' && (
                  <>
                    <Button variant="primary" onClick={() => setActiveTab('decision')}>
                      Issue Provisional Decision
                    </Button>
                  </>
                )}
                {(application.status === 'PROVISIONALLY_APPROVED' || application.status === 'INTERVIEW_COMPLETED') && (
                  <Button variant="primary" onClick={() => setActiveTab('decision')}>
                    Make Final Decision
                  </Button>
                )}
                {application.status === 'PROVISIONALLY_APPROVED' && !application.interviewScheduled && onScheduleInterview && (
                  <Button variant="secondary" onClick={() => onScheduleInterview(application)}>
                    Schedule Interview
                  </Button>
                )}
              </div>
              {onSendMessage && (
                <Button variant="secondary" onClick={() => onSendMessage(application.id)}>
                  Send Message
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Interview Tab */}
        {activeTab === 'interview' && (
          <div className="space-y-6">
            {application.interview ? (
              <>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Interview Details
                </h3>
                <div className="p-4 rounded border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-gray-200)' }}>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled For:</span>
                      <span className="font-medium">
                        {application.interview.scheduledDate} at {application.interview.scheduledTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mode:</span>
                      <Badge variant={application.interview.mode === 'ONLINE' ? 'info' : 'success'} size="sm">
                        {application.interview.mode}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge
                        variant={
                          application.interview.status === 'COMPLETED'
                            ? 'success'
                            : application.interview.status === 'SCHEDULED'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                      >
                        {application.interview.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {application.interview.score && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Score:</span>
                        <span className="font-medium">{application.interview.score}/20</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No interview scheduled for this application.</p>
                {application.status === 'PROVISIONALLY_APPROVED' && onScheduleInterview && (
                  <Button variant="primary" onClick={() => onScheduleInterview(application)}>
                    Schedule Interview
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Decision Tab */}
        {activeTab === 'decision' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {application.status === 'FORWARDED' ? 'Provisional Decision' : 'Final Decision'}
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Decision Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder="Enter your remarks for this decision..."
                className="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 min-h-[100px]"
                style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            {application.status === 'FORWARDED' && (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => handleDecision('PROVISIONAL_APPROVE_INTERVIEW')}
                  loading={isProcessing}
                  fullWidth
                >
                  Provisionally Approve (Interview Required)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDecision('PROVISIONAL_APPROVE_NO_INTERVIEW')}
                  loading={isProcessing}
                  fullWidth
                >
                  Provisionally Approve (No Interview)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDecision('PROVISIONAL_REJECT')}
                  loading={isProcessing}
                  fullWidth
                >
                  Reject Application
                </Button>
              </div>
            )}

            {(application.status === 'PROVISIONALLY_APPROVED' || application.status === 'INTERVIEW_COMPLETED') && (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => handleDecision('FINAL_APPROVE')}
                  loading={isProcessing}
                  fullWidth
                >
                  Final Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDecision('FINAL_REJECT')}
                  loading={isProcessing}
                  fullWidth
                >
                  Final Reject
                </Button>
                <div className="mt-4 p-3 rounded border-l-4 bg-blue-50 border-blue-500">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Final approval will create a student account and send login credentials to the applicant.
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded border-l-4 bg-red-50 border-red-500">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Audit Trail
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Application ID: {application.id} | Current Status: {application.status.replace(/_/g, ' ')}
            </p>

            <div className="space-y-3">
              {[
                {
                  date: 'Loading...',
                  event: 'Application history will be loaded from API',
                  user: 'System',
                  details: 'Audit trail data',
                },
              ].map((entry, index) => (
                <div
                  key={index}
                  className="p-3 rounded border"
                  style={{ background: 'var(--bg-page)', borderColor: 'var(--border-gray-200)' }}
                >
                  <div className="text-xs text-gray-500 mb-1">{entry.date}</div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {entry.event}
                  </div>
                  <div className="text-sm text-gray-600">By: {entry.user}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
