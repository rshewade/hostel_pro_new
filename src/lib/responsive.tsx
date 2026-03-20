'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface GridConfig {
  columns: number;
  gutter: number;
  margin: number;
  maxWidth: number;
}

export const BREAKPOINTS: Record<Breakpoint, GridConfig> = {
  xs: { columns: 4, gutter: 16, margin: 16, maxWidth: 100 },
  sm: { columns: 4, gutter: 16, margin: 20, maxWidth: 640 },
  md: { columns: 8, gutter: 24, margin: 24, maxWidth: 768 },
  lg: { columns: 12, gutter: 24, margin: 32, maxWidth: 1024 },
  xl: { columns: 12, gutter: 32, margin: 48, maxWidth: 1280 },
  '2xl': { columns: 12, gutter: 32, margin: 64, maxWidth: 1440 },
};

export const BREAKPOINT_ORDER: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

interface ResponsiveContextType {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  config: GridConfig;
  greaterThan: (bp: Breakpoint) => boolean;
  lessThan: (bp: Breakpoint) => boolean;
  isAtLeast: (bp: Breakpoint) => boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

const getBreakpoint = (width: number): Breakpoint => {
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
};

const BREAKPOINT_VALUES: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

interface ResponsiveProviderProps {
  children: ReactNode;
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const config = BREAKPOINTS[breakpoint];

  const greaterThan = (bp: Breakpoint): boolean => {
    return width > BREAKPOINT_VALUES[bp];
  };

  const lessThan = (bp: Breakpoint): boolean => {
    return width < BREAKPOINT_VALUES[bp];
  };

  const isAtLeast = (bp: Breakpoint): boolean => {
    return width >= BREAKPOINT_VALUES[bp];
  };

  const value: ResponsiveContextType = {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
    width,
    config,
    greaterThan,
    lessThan,
    isAtLeast,
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = (): ResponsiveContextType => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};

export const useBreakpoint = (): Breakpoint => {
  const { breakpoint } = useResponsive();
  return breakpoint;
};

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

export default ResponsiveProvider;
