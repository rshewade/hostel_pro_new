'use client';

import { useState } from 'react';
import { Modal } from '@/components/feedback/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Application } from './ApplicationReviewModal';

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onSchedule: (data: {
    applicationId: string;
    date: string;
    time: string;
    mode: 'ONLINE' | 'PHYSICAL';
    sendInvitation: boolean;
    sendReminder: boolean;
  }) => Promise<void>;
}

export function InterviewScheduleModal({
  isOpen,
  onClose,
  application,
  onSchedule,
}: InterviewScheduleModalProps) {
  const [mode, setMode] = useState<'ONLINE' | 'PHYSICAL'>('ONLINE');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sendInvitation, setSendInvitation] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!application || !date || !time) {
      setError('Please select both date and time for the interview');
      return;
    }

    setIsScheduling(true);
    setError(null);
    try {
      await onSchedule({
        applicationId: application.id,
        date,
        time,
        mode,
        sendInvitation,
        sendReminder,
      });
      // Reset form
      setMode('ONLINE');
      setDate('');
      setTime('');
      setSendInvitation(true);
      setSendReminder(true);
      onClose();
    } catch {
      setError('Failed to schedule interview. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  if (!application) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Interview"
      size="md"
    >
      <div className="space-y-6">
        {/* Application Summary */}
        <div className="p-4 rounded border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-gray-200)' }}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-600">Applicant</label>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {application.applicantName}
              </p>
            </div>
            <div>
              <label className="text-gray-600">Tracking Number</label>
              <p className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                {application.trackingNumber}
              </p>
            </div>
            <div>
              <label className="text-gray-600">Vertical</label>
              <Badge
                variant={application.vertical === 'BOYS' ? 'success' : application.vertical === 'GIRLS' ? 'warning' : 'info'}
                size="sm"
                className="mt-1"
              >
                {application.vertical}
              </Badge>
            </div>
          </div>
        </div>

        {/* Interview Mode */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
            Interview Mode
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="ONLINE"
                checked={mode === 'ONLINE'}
                onChange={(e) => setMode(e.target.value as 'ONLINE' | 'PHYSICAL')}
                className="w-4 h-4"
              />
              <span className="text-sm">Online (Zoom/Google Meet)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="PHYSICAL"
                checked={mode === 'PHYSICAL'}
                onChange={(e) => setMode(e.target.value as 'ONLINE' | 'PHYSICAL')}
                className="w-4 h-4"
              />
              <span className="text-sm">Physical</span>
            </label>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="interview-date" className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="interview-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <label htmlFor="interview-time" className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
              Time <span className="text-red-500">*</span>
            </label>
            <input
              id="interview-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}
              required
            />
          </div>
        </div>

        {/* Notification Options */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendInvitation}
              onChange={(e) => setSendInvitation(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Send interview invitation to applicant via SMS/Email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendReminder}
              onChange={(e) => setSendReminder(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Send auto-reminder 24 hours before interview</span>
          </label>
        </div>

        {/* Info Note */}
        {mode === 'ONLINE' && (
          <div className="p-3 rounded border-l-4 bg-blue-50 border-blue-500">
            <p className="text-sm text-blue-800">
              A meeting link will be generated automatically and sent to the applicant.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded border-l-4 bg-red-50 border-red-500">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-gray-200)' }}>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isScheduling}
            disabled={!date || !time}
          >
            Schedule Interview
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
