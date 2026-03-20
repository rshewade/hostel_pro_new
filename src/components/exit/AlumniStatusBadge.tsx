'use client';

import React from 'react';
import { GraduationCap, Archive } from 'lucide-react';
import { cn } from '../utils';
import type { AlumniStatus } from './types';

interface AlumniStatusBadgeProps {
  status: AlumniStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const AlumniStatusBadge: React.FC<AlumniStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const badgeConfig = {
    ALUMNI: {
      label: 'Alumni',
      icon: GraduationCap,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-300',
    },
    ARCHIVED: {
      label: 'Archived',
      icon: Archive,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
    },
  };

  const config = badgeConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

AlumniStatusBadge.displayName = 'AlumniStatusBadge';
