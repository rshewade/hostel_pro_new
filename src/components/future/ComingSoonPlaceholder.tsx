'use client';

import { cn } from '@/components/utils';

export interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'card' | 'page' | 'nav-item';
  className?: string;
  featureFlag?: string;
  estimatedLaunch?: string;
  onClick?: () => void;
}

export function ComingSoonPlaceholder({
  title,
  description,
  icon,
  variant = 'card',
  className,
  featureFlag,
  estimatedLaunch,
  onClick,
}: ComingSoonPlaceholderProps) {
  const baseStyles = cn(
    'coming-soon-placeholder',
    'flex flex-col items-center justify-center',
    'text-center transition-all duration-200',
    'cursor-not-allowed'
  );

  const variantStyles = {
    card: cn(
      'p-6 rounded-lg border-2 border-dashed',
      'bg-gray-50 border-gray-200',
      'hover:bg-gray-100 hover:border-gray-300',
      'min-h-[160px]'
    ),
    page: cn(
      'py-16 px-8',
      'bg-page rounded-lg',
      'min-h-[400px]'
    ),
    'nav-item': cn(
      'p-3 rounded-md',
      'bg-gray-50 border border-gray-200',
      'hover:bg-gray-100'
    ),
  };

  const iconContainerStyles = cn(
    'w-12 h-12 rounded-full flex items-center justify-center mb-4',
    'bg-gray-100 text-gray-400'
  );

  const titleStyles = cn(
    'font-semibold mb-2',
    variant === 'page' ? 'text-heading-2' : 'text-body font-medium',
    'text-gray-700'
  );

  const descriptionStyles = cn(
    'text-body-sm',
    'text-gray-500',
    variant === 'page' && 'max-w-md mx-auto'
  );

  const badgeStyles = cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1',
    'rounded-full text-xs font-medium',
    'bg-amber-100 text-amber-700',
    'mt-4'
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={handleClick}
      role="region"
      aria-label={`${title} - Coming Soon`}
    >
      {icon && (
        <div className={iconContainerStyles}>
          <span className="w-6 h-6" aria-hidden="true">{icon}</span>
        </div>
      )}

      <h3 className={titleStyles}>{title}</h3>

      <p className={descriptionStyles}>{description}</p>

      {estimatedLaunch && (
        <div className={badgeStyles}>
          <ClockIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Est. {estimatedLaunch}</span>
        </div>
      )}

      {featureFlag && (
        <div className={cn(badgeStyles, 'bg-blue-100 text-blue-700 mt-2')}>
          <span>FF: {featureFlag}</span>
        </div>
      )}
    </div>
  );
}

export interface FutureModuleCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  featureFlag?: string;
  estimatedLaunch?: string;
  className?: string;
}

export function FutureModuleCard({
  title,
  description,
  icon,
  featureFlag,
  estimatedLaunch,
  className,
}: FutureModuleCardProps) {
  return (
    <ComingSoonPlaceholder
      title={title}
      description={description}
      icon={icon}
      variant="card"
      featureFlag={featureFlag}
      estimatedLaunch={estimatedLaunch}
      className={className}
    />
  );
}

export interface FutureModulePageProps {
  title: string;
  description: string;
  fullDescription?: string;
  icon?: React.ReactNode;
  featureFlag?: string;
  estimatedLaunch?: string;
  plannedFeatures?: string[];
  className?: string;
}

export function FutureModulePage({
  title,
  description,
  fullDescription,
  icon,
  featureFlag,
  estimatedLaunch,
  plannedFeatures,
  className,
}: FutureModulePageProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <header className="px-6 py-4 border-b" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <ComingSoonPlaceholder
            title={title}
            description={fullDescription || description}
            icon={icon}
            variant="page"
            featureFlag={featureFlag}
            estimatedLaunch={estimatedLaunch}
            className={className}
          />

          {plannedFeatures && plannedFeatures.length > 0 && (
            <div className="mt-8 p-6 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Planned Features
              </h2>
              <ul className="space-y-3">
                {plannedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5" aria-hidden="true">✓</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default ComingSoonPlaceholder;
