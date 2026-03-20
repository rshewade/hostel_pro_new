'use client';

import React, { useState } from 'react';
import { Shield, Info, X, ExternalLink } from 'lucide-react';

interface DPDPComplianceBannerProps {
  variant?: 'footer' | 'top' | 'sidebar';
  showPolicyLink?: boolean;
  showRetentionLink?: boolean;
  compact?: boolean;
  className?: string;
}

export const DPDPComplianceBanner: React.FC<DPDPComplianceBannerProps> = ({
  variant = 'footer',
  showPolicyLink = true,
  showRetentionLink = true,
  compact = false,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleClick = () => {
    window.open('/dpdp-policy', '_blank');
  };

  if (variant === 'footer') {
    return (
      <div
        className={`bg-gray-50 border-t border-gray-200 py-3 px-4 ${className}`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
            {!compact && <span>Your privacy is protected under the Data Protection and Privacy Principles (DPDP) Act.</span>}
            <span className="text-xs">
              By using this platform, you agree to our{' '}
              <button
                onClick={handleClick}
                className="text-navy-700 hover:underline inline-flex items-center gap-1"
              >
                data policy <ExternalLink className="w-3 h-3" />
              </button>
            </span>
          </div>
          {showRetentionLink && (
            <a
              href="/dpdp-policy#retention"
              className="text-sm text-navy-600 hover:underline"
            >
              Data Retention Info
            </a>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        className={`p-4 rounded-lg border ${className}`}
        style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-primary)' }}
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Privacy Protected</h4>
            <p className="text-xs text-gray-600 mb-2">
              Your data is protected under DPDP Act. Review our data policy and retention practices.
            </p>
            <div className="flex flex-wrap gap-2">
              {showPolicyLink && (
                <button
                  onClick={handleClick}
                  className="text-xs text-navy-700 hover:underline"
                >
                  View Data Policy
                </button>
              )}
              {showRetentionLink && (
                <a href="/dpdp-policy#retention" className="text-xs text-navy-700 hover:underline">
                  Retention Info
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-blue-50 border-l-4 border-blue-500 p-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">Data Privacy Notice</h4>
          <p className="text-sm text-blue-800 mb-2">
            Your personal data is collected and processed in accordance with the Data Protection and Privacy Principles (DPDP) Act.
          </p>
          <div className="flex flex-wrap gap-3">
            {showPolicyLink && (
              <button
                onClick={handleClick}
                className="text-sm text-blue-700 hover:underline font-medium"
              >
                Read Full Policy
              </button>
            )}
            {showRetentionLink && (
              <a href="/dpdp-policy#retention" className="text-sm text-blue-700 hover:underline font-medium">
                Data Retention Guidelines
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-500 hover:text-blue-700"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DPDPComplianceBanner;
