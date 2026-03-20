import { type ReactNode } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info';

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}

const statusVariantMap: Record<string, Variant> = {
  ACTIVE: 'success', APPROVED: 'success', PAID: 'success', VERIFIED: 'success', COMPLETED: 'success',
  PENDING: 'warning', SUBMITTED: 'warning', REVIEW: 'warning', SCHEDULED: 'warning',
  REJECTED: 'error', CANCELLED: 'error', OVERDUE: 'error', FAILED: 'error',
  DRAFT: 'default', ARCHIVED: 'default',
  INTERVIEW: 'info', AVAILABLE: 'info',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariantMap[status] ?? 'default'}>{status}</Badge>;
}
