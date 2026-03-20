'use client';

import { cn } from '@/components/utils';
import { LucideIcon } from 'lucide-react';

interface TrusteeStatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
  onClick?: () => void;
}

export function TrusteeStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  loading = false,
  onClick,
}: TrusteeStatsCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-white',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      valueColor: 'text-gray-900',
    },
    primary: {
      bg: 'bg-white',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-white',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700',
    },
    warning: {
      bg: 'bg-white',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      valueColor: 'text-yellow-700',
    },
    error: {
      bg: 'bg-white',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'p-6 rounded-lg border border-gray-200 transition-all',
        styles.bg,
        onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300'
      )}
      onClick={onClick}
      style={{ background: 'var(--surface-primary)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p
              className={cn('text-3xl font-bold', styles.valueColor)}
              style={{ color: 'var(--text-primary)' }}
            >
              {value}
            </p>
          )}
          {subtitle && (
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.direction === 'up' && 'text-green-600',
                  trend.direction === 'down' && 'text-red-600',
                  trend.direction === 'neutral' && 'text-gray-600'
                )}
              >
                {trend.direction === 'up' && '+'}
                {trend.direction === 'down' && '-'}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', styles.iconBg)}>
            <Icon className={cn('w-6 h-6', styles.iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
