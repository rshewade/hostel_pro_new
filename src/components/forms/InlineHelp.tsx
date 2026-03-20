'use client';

import { cn } from '../utils';
import type { BaseComponentProps } from '../types';

export interface InlineHelpProps extends BaseComponentProps {
  content: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom';
}

export function InlineHelp({
  content,
  icon,
  size = 'md',
  position = 'bottom',
  className,
  ...props
}: InlineHelpProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const defaultIcon = (
    <svg
      className={cn('text-gray-500 flex-shrink-0', iconSizeClasses[size])}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div
      className={cn('flex items-start gap-1.5', className)}
      {...props}
    >
      <span className="flex-shrink-0 mt-0.5">{icon || defaultIcon}</span>
      <p className={cn('text-gray-600', sizeClasses[size])}>
        {content}
      </p>
    </div>
  );
}

export interface FieldErrorProps extends BaseComponentProps {
  message: string;
  id?: string;
}

export function FieldError({ message, id, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      className={cn(
        'text-sm mt-1 flex items-center gap-1',
        'text-red-600',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
    </p>
  );
}

export interface FormFieldWrapperProps extends BaseComponentProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  labelId?: string;
  errorId?: string;
  helperId?: string;
}

export function FormFieldWrapper({
  label,
  required,
  error,
  helperText,
  children,
  labelId,
  errorId,
  helperId,
  className,
  ...props
}: FormFieldWrapperProps) {
  const generatedLabelId = labelId || `label-${Math.random().toString(36).substr(2, 9)}`;
  const generatedErrorId = errorId || `error-${Math.random().toString(36).substr(2, 9)}`;
  const generatedHelperId = helperId || `helper-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      <label
        id={generatedLabelId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>

      {children}

      {error && (
        <FieldError
          message={error}
          id={generatedErrorId}
          aria-describedby={generatedLabelId}
        />
      )}

      {helperText && !error && (
        <p
          id={generatedHelperId}
          className="text-sm text-gray-500"
          aria-describedby={generatedLabelId}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export default InlineHelp;
