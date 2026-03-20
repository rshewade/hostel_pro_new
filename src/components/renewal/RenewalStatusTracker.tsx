'use client';

import React from 'react';
import { cn } from '@/components/utils';
import { CheckCircle, Circle, Clock, AlertCircle, XCircle } from 'lucide-react';

export type RenewalStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'DOCUMENTS_PENDING'
  | 'PAYMENT_PENDING'
  | 'CONSENT_PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface RenewalStatusTrackerProps {
  currentStatus: RenewalStatus;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

interface StatusStep {
  key: RenewalStatus;
  label: string;
  description?: string;
}

const STEPS: StatusStep[] = [
  { key: 'NOT_STARTED', label: 'Not Started' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DOCUMENTS_PENDING', label: 'Documents' },
  { key: 'PAYMENT_PENDING', label: 'Payment' },
  { key: 'CONSENT_PENDING', label: 'Consent' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Action Required' },
];

const SHORT_STEPS: StatusStep[] = [
  { key: 'NOT_STARTED', label: 'Start' },
  { key: 'IN_PROGRESS', label: 'Progress' },
  { key: 'DOCUMENTS_PENDING', label: 'Docs' },
  { key: 'PAYMENT_PENDING', label: 'Pay' },
  { key: 'CONSENT_PENDING', label: 'Consent' },
  { key: 'SUBMITTED', label: 'Submit' },
  { key: 'UNDER_REVIEW', label: 'Review' },
  { key: 'APPROVED', label: 'Done' },
  { key: 'REJECTED', label: 'Issue' },
];

const REJECTED_STEPS: StatusStep[] = [
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'REJECTED', label: 'Rejected' },
];

export function RenewalStatusTracker({
  currentStatus,
  className,
  showLabels = true,
  size = 'md',
  orientation = 'horizontal',
}: RenewalStatusTrackerProps) {
  const steps = currentStatus === 'REJECTED' ? REJECTED_STEPS : (showLabels ? STEPS : SHORT_STEPS);

  const getCurrentIndex = () => {
    const index = steps.findIndex((step) => step.key === currentStatus);
    if (index === -1) {
      if (['DOCUMENTS_PENDING', 'PAYMENT_PENDING', 'CONSENT_PENDING'].includes(currentStatus)) {
        return steps.findIndex((step) => step.key === 'IN_PROGRESS');
      }
      return 0;
    }
    return index;
  };

  const currentIndex = getCurrentIndex();

  const getStepStatus = (index: number) => {
    if (currentStatus === 'REJECTED') {
      if (index < 2) return 'completed';
      if (index === 2) return 'current';
      return 'pending';
    }

    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (status: 'completed' | 'current' | 'pending', label: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-white" />;
    }
    if (status === 'current') {
      if (currentStatus === 'REJECTED') {
        return <XCircle className="w-5 h-5 text-red-500" />;
      }
      if (currentStatus === 'APPROVED') {
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      }
      return <Clock className="w-5 h-5 text-blue-500" />;
    }
    return <Circle className="w-4 h-4 text-gray-300" />;
  };

  const getConnectorStatus = (index: number) => {
    if (currentStatus === 'REJECTED') {
      if (index < 1) return 'completed';
      return 'pending';
    }
    if (index < currentIndex) return 'completed';
    return 'pending';
  };

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      icon: 'w-6 h-6',
      circle: 'w-6 h-6',
      line: 'h-0.5',
      text: 'text-xs',
    },
    md: {
      container: 'gap-4',
      icon: 'w-8 h-8',
      circle: 'w-8 h-8',
      line: 'h-1',
      text: 'text-sm',
    },
    lg: {
      container: 'gap-6',
      icon: 'w-10 h-10',
      circle: 'w-10 h-10',
      line: 'h-1.5',
      text: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col', className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div key={step.key} className="flex items-start gap-4 relative pb-6 last:pb-0">
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-4 top-8 w-0.5 -translate-x-1/2',
                    getConnectorStatus(index) === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  )}
                  style={{ height: 'calc(100% - 2rem)' }}
                />
              )}
              <div
                className={cn(
                  'flex-shrink-0 flex items-center justify-center rounded-full border-2',
                  status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : status === 'current'
                    ? currentStatus === 'REJECTED'
                      ? 'bg-white border-red-500'
                      : 'bg-white border-blue-500'
                    : 'bg-white border-gray-200'
                )}
                style={{ width: sizes.circle, height: sizes.circle }}
              >
                {status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : status === 'current' ? (
                  currentStatus === 'REJECTED' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : currentStatus === 'APPROVED' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-500" />
                  )
                ) : (
                  <Circle className="w-3 h-3 text-gray-300" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p
                  className={cn(
                    'font-medium',
                    status === 'current'
                      ? currentStatus === 'REJECTED'
                        ? 'text-red-600'
                        : 'text-blue-600'
                      : status === 'completed'
                      ? 'text-green-600'
                      : 'text-gray-500'
                  )}
                  style={{ color: status === 'current' ? 'var(--color-blue-600)' : undefined }}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const connectorStatus = getConnectorStatus(index);

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border-2',
                  status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : status === 'current'
                    ? currentStatus === 'REJECTED'
                      ? 'bg-white border-red-500'
                      : 'bg-white border-blue-500'
                    : 'bg-white border-gray-200'
                )}
                style={{ width: sizes.circle, height: sizes.circle }}
              >
                {status === 'completed' ? (
                  <CheckCircle className={cn('text-white', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
                ) : status === 'current' ? (
                  currentStatus === 'REJECTED' ? (
                    <XCircle className={cn('text-red-500', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
                  ) : currentStatus === 'APPROVED' ? (
                    <CheckCircle className={cn('text-green-500', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
                  ) : (
                    <Clock className={cn('text-blue-500', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
                  )
                ) : (
                  <Circle className={cn('text-gray-300', size === 'sm' ? 'w-2 h-2' : 'w-3 h-3')} />
                )}
              </div>
              {showLabels && (
                <p
                  className={cn(
                    'mt-2 text-center font-medium truncate',
                    status === 'current'
                      ? 'text-blue-600'
                      : status === 'completed'
                      ? 'text-green-600'
                      : 'text-gray-400'
                  )}
                  style={{
                    color:
                      status === 'current'
                        ? 'var(--color-blue-600)'
                        : status === 'completed'
                        ? 'var(--color-green-600)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {step.label}
                </p>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 mx-2',
                  size === 'sm' ? 'h-0.5 -mt-4' : 'h-1 -mt-6'
                )}
                style={{
                  backgroundColor:
                    connectorStatus === 'completed'
                      ? 'var(--color-green-500)'
                      : 'var(--border-primary)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default RenewalStatusTracker;
