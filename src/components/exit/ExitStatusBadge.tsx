'use client';

import React from 'react';
import { cn } from '../utils';

export type ExitStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_CLEARANCE'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

interface ExitStatusBadgeProps {
  status: ExitStatus;
  className?: string;
}

const statusConfig: Record<ExitStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  UNDER_CLEARANCE: {
    label: 'Under Clearance',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  APPROVED: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: 'text-gray-700',
    bgColor: 'bg-gray-200',
  },
};

export const ExitStatusBadge: React.FC<ExitStatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};

ExitStatusBadge.displayName = 'ExitStatusBadge';
