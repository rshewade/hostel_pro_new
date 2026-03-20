'use client';

import { cn } from '../utils';
import type { BaseComponentProps, SkeletonSize } from '../types';

export interface SkeletonProps extends BaseComponentProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  lines,
  className,
  style,
  ...props
}: SkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200',
    {
      'rounded': variant === 'text',
      'rounded-full': variant === 'circular',
      'rounded-md': variant === 'rectangular',
      'animate-pulse': animation === 'pulse',
      'animate-[shimmer_2s_infinite]': animation === 'wave',
    },
    className
  );

  const inlineStyle = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
    ...style,
  };

  if (lines && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant={variant}
            animation={animation}
            width={index === lines - 1 ? '60%' : width}
            height={height}
            className={className}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={baseClasses}
      style={inlineStyle}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export interface SkeletonCardProps extends BaseComponentProps {
  showAvatar?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showAction?: boolean;
  lines?: number;
}

export function SkeletonCard({
  showAvatar = true,
  showTitle = true,
  showDescription = true,
  showAction = true,
  lines = 3,
  className,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn('p-4 border rounded-lg space-y-4', className)}
      {...props}
    >
      {showAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            {showTitle && (
              <Skeleton width="40%" height={16} />
            )}
          </div>
        </div>
      )}

      {showDescription && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              width={index === lines - 1 ? '80%' : '100%'}
              height={12}
            />
          ))}
        </div>
      )}

      {showAction && (
        <div className="flex gap-2 pt-2">
          <Skeleton width={80} height={36} variant="rectangular" />
        </div>
      )}
    </div>
  );
}

export interface SkeletonTableProps extends BaseComponentProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} height={20} />
          ))}
        </div>
      )}

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 py-3 border-t"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface SkeletonListProps extends BaseComponentProps {
  items?: number;
  showAvatar?: boolean;
  showMeta?: boolean;
}

export function SkeletonList({
  items = 5,
  showAvatar = true,
  showMeta = true,
  className,
  ...props
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-2">
          {showAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="30%" height={14} />
            {showMeta && (
              <Skeleton width="50%" height={12} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
