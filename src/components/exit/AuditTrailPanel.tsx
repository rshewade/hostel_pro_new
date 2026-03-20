'use client';

import React from 'react';
import { Clock, User, FileEdit, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../utils';

export interface AuditEntry {
  id: string;
  action: 'CREATED' | 'EDITED' | 'SUBMITTED' | 'CANCELLED' | 'WITHDRAWN' | 'APPROVED' | 'REJECTED' | 'STATUS_CHANGE';
  description: string;
  actor: string;
  actorRole?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AuditTrailPanelProps {
  entries: AuditEntry[];
  className?: string;
}

const actionConfig: Record<AuditEntry['action'], { icon: React.ReactNode; color: string }> = {
  CREATED: { icon: <FileEdit className="w-4 h-4" />, color: 'text-blue-600' },
  EDITED: { icon: <FileEdit className="w-4 h-4" />, color: 'text-blue-600' },
  SUBMITTED: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' },
  CANCELLED: { icon: <XCircle className="w-4 h-4" />, color: 'text-gray-600' },
  WITHDRAWN: { icon: <XCircle className="w-4 h-4" />, color: 'text-orange-600' },
  APPROVED: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' },
  REJECTED: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600' },
  STATUS_CHANGE: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-yellow-600' },
};

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({ entries, className }) => {
  if (entries.length === 0) {
    return (
      <div className={cn('card p-6', className)}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Audit Trail
        </h3>
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
          No activity recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn('card p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Audit Trail
        </h3>
      </div>

      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Complete history of all actions taken on this exit request. This log is immutable and maintained for compliance purposes.
      </p>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const config = actionConfig[entry.action];
          const isLast = index === entries.length - 1;

          return (
            <div key={entry.id} className="relative">
              {!isLast && (
                <div
                  className="absolute left-5 top-10 bottom-0 w-px"
                  style={{ background: 'var(--border-primary)' }}
                />
              )}

              <div className="flex gap-3">
                <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', 'bg-gray-100')}>
                  <span className={config.color}>{config.icon}</span>
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <User className="w-3 h-3" />
                          <span>{entry.actor}</span>
                          {entry.actorRole && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {entry.actorRole}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <time className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </time>
                  </div>

                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div
                      className="mt-2 p-2 rounded text-xs"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    >
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

AuditTrailPanel.displayName = 'AuditTrailPanel';
