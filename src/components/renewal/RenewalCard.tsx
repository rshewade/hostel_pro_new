'use client';

import React from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CalendarDays, Clock, FileText, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import type { RenewalStatus } from './RenewalStatusTracker';

export interface RenewalCardProps {
  studentId: string;
  studentName: string;
  vertical: string;
  renewalStatus: RenewalStatus | 'EXPIRED';
  daysRemaining: number;
  academicYear: string;
  period: string;
  onStartRenewal?: () => void;
  onContinueRenewal?: () => void;
  onViewStatus?: () => void;
  className?: string;
}

export function RenewalCard({
  studentId,
  studentName,
  vertical,
  renewalStatus,
  daysRemaining,
  academicYear,
  period,
  onStartRenewal,
  onContinueRenewal,
  onViewStatus,
  className,
}: RenewalCardProps) {
  const getStatusConfig = () => {
    switch (renewalStatus) {
      case 'NOT_STARTED':
        return {
          badge: <Badge variant="warning" size="md">Not Started</Badge>,
          icon: <CalendarDays className="w-12 h-12 text-amber-500" />,
          urgency: daysRemaining <= 15 ? 'high' : daysRemaining <= 30 ? 'medium' : 'low',
        };
      case 'IN_PROGRESS':
      case 'DOCUMENTS_PENDING':
      case 'PAYMENT_PENDING':
      case 'CONSENT_PENDING':
        return {
          badge: <Badge variant="info" size="md">In Progress</Badge>,
          icon: <Clock className="w-12 h-12 text-blue-500" />,
          urgency: 'medium',
        };
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return {
          badge: <Badge variant="default" size="md">Under Review</Badge>,
          icon: <FileText className="w-12 h-12 text-gray-500" />,
          urgency: 'low',
        };
      case 'APPROVED':
        return {
          badge: <Badge variant="success" size="md">Approved</Badge>,
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          urgency: 'low',
        };
      case 'REJECTED':
        return {
          badge: <Badge variant="error" size="md">Action Required</Badge>,
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          urgency: 'high',
        };
      case 'EXPIRED':
        return {
          badge: <Badge variant="error" size="md">Expired</Badge>,
          icon: <AlertCircle className="w-12 h-12 text-red-600" />,
          urgency: 'critical',
        };
      default:
        return {
          badge: <Badge variant="default" size="md">{renewalStatus}</Badge>,
          icon: <CalendarDays className="w-12 h-12 text-gray-400" />,
          urgency: 'low',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const getUrgencyMessage = () => {
    if (renewalStatus === 'EXPIRED') {
      return {
        type: 'error' as const,
        message: 'Your renewal period has expired. Please contact the administration immediately.',
      };
    }
    if (renewalStatus === 'REJECTED') {
      return {
        type: 'error' as const,
        message: 'Your renewal was not approved. Please review the remarks and resubmit.',
      };
    }
    if (daysRemaining <= 7) {
      return {
        type: 'error' as const,
        message: `Urgent: Only ${daysRemaining} days left to complete your renewal!`,
      };
    }
    if (daysRemaining <= 15) {
      return {
        type: 'warning' as const,
        message: `Hurry! Only ${daysRemaining} days remaining for timely renewal.`,
      };
    }
    if (daysRemaining <= 30) {
      return {
        type: 'info' as const,
        message: `Renewal deadline in ${daysRemaining} days. Complete early to avoid last-minute issues.`,
      };
    }
    return {
      type: 'success' as const,
      message: `You have ${daysRemaining} days remaining. Early renewal ensures smooth continuation.`,
    };
  };

  const urgencyMessage = getUrgencyMessage();

  const getActionButton = () => {
    if (renewalStatus === 'NOT_STARTED' && onStartRenewal) {
      return (
        <Button variant="primary" size="lg" onClick={onStartRenewal} fullWidth>
          Start Renewal
        </Button>
      );
    }
    if ((renewalStatus === 'IN_PROGRESS' || renewalStatus === 'REJECTED') && onContinueRenewal) {
      return (
        <Button variant="primary" size="lg" onClick={onContinueRenewal} fullWidth>
          Continue Renewal
        </Button>
      );
    }
    if (renewalStatus === 'UNDER_REVIEW' && onViewStatus) {
      return (
        <Button variant="secondary" size="lg" onClick={onViewStatus} fullWidth>
          View Status
        </Button>
      );
    }
    if (renewalStatus === 'APPROVED' && onViewStatus) {
      return (
        <Button variant="ghost" size="lg" onClick={onViewStatus} fullWidth>
          View Details
        </Button>
      );
    }
    return null;
  };

  return (
    <Card className={className} padding="lg" shadow="md">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-gray-100">
          {statusConfig.icon}
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                6-Month Stay Renewal
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {academicYear} | {period.replace('_', ' ')}
              </p>
            </div>
            {statusConfig.badge}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Student Name
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {studentName}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Vertical
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {vertical}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Days Remaining
              </p>
              <p
                className="text-sm font-semibold"
                style={{
                  color:
                    daysRemaining <= 7
                      ? 'var(--color-red-600)'
                      : daysRemaining <= 15
                      ? 'var(--color-amber-600)'
                      : 'var(--text-primary)',
                }}
              >
                {renewalStatus === 'EXPIRED' ? 'Expired' : `${daysRemaining} days`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Renewal For
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Next 6 Months
              </p>
            </div>
          </div>

          <div
            className={`p-3 rounded-lg mb-4 ${
              urgencyMessage.type === 'error'
                ? 'bg-red-50 border-l-4 border-red-500'
                : urgencyMessage.type === 'warning'
                ? 'bg-amber-50 border-l-4 border-amber-500'
                : urgencyMessage.type === 'info'
                ? 'bg-blue-50 border-l-4 border-blue-500'
                : 'bg-green-50 border-l-4 border-green-500'
            }`}
          >
            <p
              className="text-sm"
              style={{
                color:
                  urgencyMessage.type === 'error'
                    ? 'var(--color-red-700)'
                    : urgencyMessage.type === 'warning'
                    ? 'var(--color-amber-700)'
                    : urgencyMessage.type === 'info'
                    ? 'var(--color-blue-700)'
                    : 'var(--color-green-700)',
              }}
            >
              {urgencyMessage.message}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Fee payment required</span>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Document re-upload required</span>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <CreditCard className="w-4 h-4 text-purple-500" />
              <span>DPDP consent required</span>
            </div>
          </div>

          {getActionButton()}
        </div>
      </div>
    </Card>
  );
}

export default RenewalCard;
