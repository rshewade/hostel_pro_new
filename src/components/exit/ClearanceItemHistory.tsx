'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, User } from 'lucide-react';
import { cn } from '../utils';
import { ClearanceItemHistoryEntry, ClearanceItemStatus } from './types';

interface ClearanceItemHistoryProps {
  history: ClearanceItemHistoryEntry[];
  className?: string;
}

const statusColors: Record<ClearanceItemStatus, string> = {
  PENDING: 'text-gray-600',
  IN_PROGRESS: 'text-blue-600',
  COMPLETED: 'text-green-600',
  WAIVED: 'text-purple-600',
};

export const ClearanceItemHistory: React.FC<ClearanceItemHistoryProps> = ({
  history,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-2', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: 'var(--text-secondary)' }}
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        View History ({history.length} {history.length === 1 ? 'entry' : 'entries'})
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 pl-4 border-l-2" style={{ borderColor: 'var(--border-primary)' }}>
          {history.map((entry, index) => (
            <div
              key={entry.id}
              className="pb-2"
              style={{
                borderBottom:
                  index < history.length - 1 ? '1px solid var(--border-primary)' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('font-medium text-sm', statusColors[entry.newStatus])}>
                      {entry.previousStatus ? (
                        <>
                          {entry.previousStatus} → {entry.newStatus}
                        </>
                      ) : (
                        <>{entry.newStatus}</>
                      )}
                    </span>
                    {entry.justification && (
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                        Override
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <User className="w-3 h-3" />
                    <span>{entry.actor}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {entry.actorRole}
                    </span>
                  </div>

                  {entry.remarks && (
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                      <strong>Remarks:</strong> {entry.remarks}
                    </p>
                  )}

                  {entry.justification && (
                    <div
                      className="mt-2 p-2 rounded text-sm bg-orange-50 border border-orange-200"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <strong className="text-orange-700">Justification:</strong> {entry.justification}
                    </div>
                  )}
                </div>

                <time className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ClearanceItemHistory.displayName = 'ClearanceItemHistory';
