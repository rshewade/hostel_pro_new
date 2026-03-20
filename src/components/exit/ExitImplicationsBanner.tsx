'use client';

import React from 'react';
import { AlertCircle, IndianRupee, Calendar, Home, Info } from 'lucide-react';
import { cn } from '../utils';

interface ExitImplicationsBannerProps {
  className?: string;
}

export const ExitImplicationsBanner: React.FC<ExitImplicationsBannerProps> = ({ className }) => {
  const implications = [
    {
      icon: <IndianRupee className="w-5 h-5" />,
      title: 'Deposit & Fees',
      description: 'Security deposit will be refunded after clearance. Fees are non-refundable and will be prorated based on your stay period.',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: 'Notice Period',
      description: 'Minimum 30 days notice required. Early exit may result in penalty charges as per hostel policy.',
    },
    {
      icon: <Home className="w-5 h-5" />,
      title: 'Room Access',
      description: 'Hostel access will be revoked on the approved exit date. Please ensure all belongings are removed before the exit date.',
    },
    {
      icon: <Info className="w-5 h-5" />,
      title: 'Clearance Required',
      description: 'All clearances must be completed (room, accounts, library, etc.) before final approval. Pending dues will be deducted from deposit.',
    },
  ];

  return (
    <div className={cn('card p-6', className)}>
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Important: Exit Process Implications
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Please read and understand the following before submitting your exit request:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {implications.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 p-4 rounded-lg"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="flex-shrink-0 text-blue-600">{item.icon}</div>
            <div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 p-3 rounded-lg border-l-4 border-orange-500"
        style={{ background: 'var(--bg-accent-soft)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          <strong>Note:</strong> Once submitted, your exit request cannot be cancelled after the clearance process begins.
          You will have a limited window to edit or withdraw your request before it enters clearance.
        </p>
      </div>
    </div>
  );
};

ExitImplicationsBanner.displayName = 'ExitImplicationsBanner';
