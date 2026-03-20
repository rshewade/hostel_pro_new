// Re-export Card from data/ for backward compatibility
export { Card } from '@/components/data/Card';

// Additional card sub-components for dashboard pages
import { type ReactNode } from 'react';

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</h3>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
