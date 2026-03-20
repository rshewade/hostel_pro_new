'use client';

import React from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import {
  AlertCircle,
  AlertTriangle,
  InfoIcon,
  CheckCircle,
  Clock,
  Calendar,
  ArrowRight,
} from 'lucide-react';

export type RenewalBannerType = 'info' | 'warning' | 'error' | 'success' | 'urgent';

export interface RenewalBannerProps {
  type: RenewalBannerType;
  title: string;
  message: string;
  daysRemaining: number;
  onAction?: () => void;
  actionLabel?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const BANNER_CONFIG = {
  info: {
    icon: InfoIcon,
    bgColor: 'var(--color-blue-50)',
    borderColor: 'var(--color-blue-200)',
    textColor: 'var(--color-blue-800)',
    iconColor: 'var(--color-blue-600)',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'var(--color-amber-50)',
    borderColor: 'var(--color-amber-200)',
    textColor: 'var(--color-amber-800)',
    iconColor: 'var(--color-amber-600)',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'var(--color-red-50)',
    borderColor: 'var(--color-red-200)',
    textColor: 'var(--color-red-800)',
    iconColor: 'var(--color-red-600)',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'var(--color-green-50)',
    borderColor: 'var(--color-green-200)',
    textColor: 'var(--color-green-800)',
    iconColor: 'var(--color-green-600)',
  },
  urgent: {
    icon: Clock,
    bgColor: 'var(--color-red-100)',
    borderColor: 'var(--color-red-400)',
    textColor: 'var(--color-red-900)',
    iconColor: 'var(--color-red-700)',
  },
};

interface EarlyRenewalBannerProps {
  daysUntilWindow: number;
  onLearnMore?: () => void;
  className?: string;
}

interface LastMinuteBannerProps {
  hoursRemaining: number;
  onUrgentAction?: () => void;
  className?: string;
}

interface MissedDeadlineBannerProps {
  daysOverdue: number;
  onContactSupport?: () => void;
  className?: string;
}

export function RenewalBanner({
  type,
  title,
  message,
  daysRemaining,
  onAction,
  actionLabel,
  dismissible = false,
  onDismiss,
  className,
}: RenewalBannerProps) {
  const config = BANNER_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card
      className={className}
      padding="md"
      style={{
        backgroundColor: config.bgColor,
        borderLeftWidth: '4px',
        borderLeftColor: config.borderColor,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="w-6 h-6" style={{ color: config.iconColor }} />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold" style={{ color: config.textColor }}>
                  {title}
                </h4>
                {daysRemaining <= 7 && daysRemaining > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: config.borderColor,
                      color: config.textColor,
                    }}
                  >
                    {daysRemaining} days left
                  </span>
                )}
                {daysRemaining === 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium animate-pulse"
                    style={{
                      backgroundColor: config.borderColor,
                      color: config.textColor,
                    }}
                  >
                    Last Day
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: config.textColor, opacity: 0.9 }}>
                {message}
              </p>
            </div>

            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
                style={{ color: config.textColor, opacity: 0.6 }}
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            )}
          </div>

          {onAction && actionLabel && (
            <div className="mt-4">
              <Button
                variant={type === 'error' || type === 'urgent' ? 'primary' : 'primary'}
                size="sm"
                onClick={onAction}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {actionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function EarlyRenewalBanner({
  daysUntilWindow,
  onLearnMore,
  className,
}: EarlyRenewalBannerProps) {
  return (
    <RenewalBanner
      type="info"
      title="Renewal Window Not Yet Open"
      message={`Your renewal window will open in ${daysUntilWindow} days. You can prepare your documents in advance to ensure a smooth renewal process when the window opens.`}
      daysRemaining={daysUntilWindow}
      onAction={onLearnMore}
      actionLabel="Learn About Renewal"
      className={className}
    />
  );
}

export function LastMinuteBanner({
  hoursRemaining,
  onUrgentAction,
  className,
}: LastMinuteBannerProps) {
  const isCritical = hoursRemaining <= 24;

  return (
    <RenewalBanner
      type={isCritical ? 'urgent' : 'warning'}
      title={isCritical ? "Urgent: Renewal Deadline Approaching!" : "Renewal Deadline Very Close"}
      message={
        isCritical
          ? `You have less than ${hoursRemaining} hours remaining to complete your renewal. Please complete all steps immediately to avoid any interruption in your stay.`
          : `Only ${hoursRemaining} hours left before the renewal deadline. Please complete your renewal now to ensure continuous accommodation.`
      }
      daysRemaining={0}
      onAction={onUrgentAction}
      actionLabel={isCritical ? "Complete Renewal Now" : "Renew Immediately"}
      className={className}
    />
  );
}

export function MissedDeadlineBanner({
  daysOverdue,
  onContactSupport,
  className,
}: MissedDeadlineBannerProps) {
  return (
    <RenewalBanner
      type="error"
      title="Renewal Deadline Missed"
      message={`Your renewal deadline was ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago. Please contact the administration immediately to discuss your situation and potential options. Your stay status may be affected.`}
      daysRemaining={-daysOverdue}
      onAction={onContactSupport}
      actionLabel="Contact Support"
      className={className}
    />
  );
}

interface RenewalNotificationBannerProps {
  daysRemaining: number;
  renewalStatus: string;
  onStartRenewal?: () => void;
  onContinueRenewal?: () => void;
  onViewStatus?: () => void;
  className?: string;
}

export function RenewalNotificationBanner({
  daysRemaining,
  renewalStatus,
  onStartRenewal,
  onContinueRenewal,
  onViewStatus,
  className,
}: RenewalNotificationBannerProps) {
  if (renewalStatus === 'APPROVED') {
    return (
      <RenewalBanner
        type="success"
        title="Renewal Complete"
        message="Your stay has been renewed successfully. You can continue your academic journey without interruption."
        daysRemaining={daysRemaining}
        className={className}
      />
    );
  }

  if (renewalStatus === 'UNDER_REVIEW') {
    return (
      <RenewalBanner
        type="info"
        title="Renewal Under Review"
        message="Your renewal application is currently being reviewed by the administration. You will be notified once a decision is made."
        daysRemaining={daysRemaining}
        onAction={onViewStatus}
        actionLabel="View Status"
        className={className}
      />
    );
  }

  if (renewalStatus === 'IN_PROGRESS') {
    return (
      <RenewalBanner
        type="warning"
        title="Renewal In Progress"
        message={`Please complete your renewal. ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining.`}
        daysRemaining={daysRemaining}
        onAction={onContinueRenewal}
        actionLabel="Continue Renewal"
        className={className}
      />
    );
  }

  if (daysRemaining <= 7) {
    return (
      <RenewalBanner
        type="urgent"
        title="Renewal Deadline Very Close"
        message={`Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to complete your renewal. Please start the process immediately.`}
        daysRemaining={daysRemaining}
        onAction={onStartRenewal}
        actionLabel="Start Renewal Now"
        className={className}
      />
    );
  }

  if (daysRemaining <= 15) {
    return (
      <RenewalBanner
        type="warning"
        title="Renewal Reminder"
        message={`Your renewal is due in ${daysRemaining} days. Complete early to avoid last-minute issues.`}
        daysRemaining={daysRemaining}
        onAction={onStartRenewal}
        actionLabel="Start Renewal"
        className={className}
      />
    );
  }

  if (daysRemaining <= 30) {
    return (
      <RenewalBanner
        type="info"
        title="Renewal Window Open"
        message={`You have ${daysRemaining} days remaining to complete your 6-month stay renewal.`}
        daysRemaining={daysRemaining}
        onAction={onStartRenewal}
        actionLabel="Renew Now"
        className={className}
      />
    );
  }

  return null;
}

export default RenewalBanner;
