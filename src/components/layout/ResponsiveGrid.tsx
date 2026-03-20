'use client';

import React, { ReactNode } from 'react';
import { useResponsive, Breakpoint, BREAKPOINT_ORDER } from '@/lib/responsive';
import { cn } from '../utils';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  as?: React.ElementType;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className,
  as: Component = 'div',
}) => {
  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <Component className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeMap[size], className)}>
      {children}
    </Component>
  );
};

interface GridProps {
  children: ReactNode;
  columns?: number | Partial<Record<Breakpoint, number>>;
  gap?: number | Partial<Record<Breakpoint, number>>;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 12,
  gap = 4,
  className,
}) => {
  const { breakpoint } = useResponsive();

  const getColumnClass = () => {
    if (typeof columns === 'number') {
      return `grid-cols-${columns}`;
    }
    return `grid-cols-${columns[breakpoint] || columns.md || 12}`;
  };

  const getGapClass = () => {
    if (typeof gap === 'number') {
      return `gap-${gap}`;
    }
    return `gap-${gap[breakpoint] || gap.md || 4}`;
  };

  return (
    <div className={cn('grid', getColumnClass(), getGapClass(), className)}>
      {children}
    </div>
  );
};

interface ColProps {
  children: ReactNode;
  span?: number | Partial<Record<Breakpoint, number>>;
  start?: number | Partial<Record<Breakpoint, number>>;
  end?: number | Partial<Record<Breakpoint, number>>;
  className?: string;
}

export const Col: React.FC<ColProps> = ({
  children,
  span,
  start,
  end,
  className,
}) => {
  const { breakpoint } = useResponsive();

  const getSpanClass = () => {
    if (!span) return '';
    if (typeof span === 'number') {
      return span === 12 ? 'col-span-full' : `col-span-${span}`;
    }
    const bpSpan = span[breakpoint] || span.md || 12;
    return bpSpan === 12 ? 'col-span-full' : `col-span-${bpSpan}`;
  };

  const getStartClass = () => {
    if (!start) return '';
    if (typeof start === 'number') {
      return start === 1 ? 'col-start-1' : `col-start-${start}`;
    }
    const bpStart = start[breakpoint] || start.md;
    return bpStart ? (bpStart === 1 ? 'col-start-1' : `col-start-${bpStart}`) : '';
  };

  const getEndClass = () => {
    if (!end) return '';
    if (typeof end === 'number') {
      return `col-end-${end}`;
    }
    const bpEnd = end[breakpoint] || end.md;
    return bpEnd ? `col-end-${bpEnd}` : '';
  };

  return (
    <div className={cn(getSpanClass(), getStartClass(), getEndClass(), className)}>
      {children}
    </div>
  );
};

interface StackProps {
  children: ReactNode;
  direction?: 'row' | 'col' | Partial<Record<Breakpoint, 'row' | 'col'>>;
  gap?: number | Partial<Record<Breakpoint, number>>;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'between';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'col',
  gap = 4,
  align,
  justify,
  className,
}) => {
  const { breakpoint } = useResponsive();

  const getDirectionClass = () => {
    if (typeof direction === 'string') {
      return direction === 'row' ? 'flex-row' : 'flex-col';
    }
    const dir = direction[breakpoint] || direction.md || 'col';
    return dir === 'row' ? 'flex-row' : 'flex-col';
  };

  const getGapClass = () => {
    if (typeof gap === 'number') {
      return `gap-${gap}`;
    }
    return `gap-${gap[breakpoint] || gap.md || 4}`;
  };

  const alignClass = align ? `items-${align}` : '';
  const justifyClass = justify ? `justify-${justify}` : '';

  return (
    <div className={cn('flex', getDirectionClass(), getGapClass(), alignClass, justifyClass, className)}>
      {children}
    </div>
  );
};

interface FlexProps {
  children: ReactNode;
  direction?: 'row' | 'col';
  wrap?: boolean | 'reverse';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  wrap,
  gap = 0,
  align,
  justify,
  className,
}) => {
  const wrapClass = wrap === true ? 'flex-wrap' : wrap === 'reverse' ? 'flex-wrap-reverse' : '';
  const alignClass = align ? `items-${align}` : '';
  const justifyClass = justify ? `justify-${justify}` : '';

  return (
    <div
      className={cn(
        'flex',
        direction === 'col' && 'flex-col',
        wrapClass,
        gap && `gap-${gap}`,
        alignClass,
        justifyClass,
        className
      )}
    >
      {children}
    </div>
  );
};

interface HideProps {
  on?: Breakpoint | Breakpoint[];
  at?: Breakpoint | Breakpoint[];
  className?: string;
}

export const Hide: React.FC<HideProps> = ({ on, at, className }) => {
  const { breakpoint } = useResponsive();

  const shouldHide = () => {
    if (on) {
      const onBreakpoints = Array.isArray(on) ? on : [on];
      return onBreakpoints.includes(breakpoint);
    }
    if (at) {
      const atBreakpoints = Array.isArray(at) ? at : [at];
      const bpIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
      return atBreakpoints.some((b) => BREAKPOINT_ORDER.indexOf(b) <= bpIndex);
    }
    return false;
  };

  if (shouldHide()) {
    return null;
  }

  return <div className={className} />;
};

interface ShowProps {
  on: Breakpoint | Breakpoint[];
  className?: string;
}

export const Show: React.FC<ShowProps> = ({ on, className }) => {
  const { breakpoint } = useResponsive();

  const shouldShow = () => {
    const onBreakpoints = Array.isArray(on) ? on : [on];
    return onBreakpoints.includes(breakpoint);
  };

  if (!shouldShow()) {
    return null;
  }

  return <div className={className} />;
};

export default Container;
