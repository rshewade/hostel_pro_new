'use client';

import React from 'react';
import { Calendar, User, Home, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { ExitRequestSummary, ClearanceOwnerRole } from './types';

interface ExitRequestCardProps {
  request: ExitRequestSummary;
  userRole: ClearanceOwnerRole;
  onViewDetails: (requestId: string) => void;
  className?: string;
}

export const ExitRequestCard: React.FC<ExitRequestCardProps> = ({
  request,
  userRole,
  onViewDetails,
  className,
}) => {
  const progressPercentage =
    request.clearanceProgress.total > 0
      ? Math.round((request.clearanceProgress.completed / request.clearanceProgress.total) * 100)
      : 0;

  const ownedProgressPercentage =
    request.ownedItems.total > 0
      ? Math.round((request.ownedItems.completed / request.ownedItems.total) * 100)
      : 0;

  const isOverdue = request.agingDays > 30 || request.clearanceProgress.overdue > 0;
  const exitDate = new Date(request.requestedExitDate);
  const daysUntilExit = Math.ceil((exitDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-white hover:shadow-md transition-shadow',
        request.isHighRisk && 'border-red-300 bg-red-50',
        className
      )}
      style={{ borderColor: request.isHighRisk ? undefined : 'var(--border-primary)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              {request.studentName}
            </h3>
            {request.isHighRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" />
                High Risk
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {request.studentId}
            </span>
            <span className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              Room {request.roomNumber}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {request.vertical}
            </span>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={() => onViewDetails(request.id)}>
          View Details
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Dates and Aging */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 p-3 rounded" style={{ background: 'var(--bg-secondary)' }}>
        <div>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Requested Exit Date
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-4 h-4" />
            {exitDate.toLocaleDateString()}
          </div>
          {daysUntilExit < 7 && daysUntilExit > 0 && (
            <div className="text-xs text-orange-600 mt-1">
              {daysUntilExit} days remaining
            </div>
          )}
          {daysUntilExit <= 0 && (
            <div className="text-xs text-red-600 mt-1">
              Exit date passed
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Submitted Date
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {new Date(request.submittedDate).toLocaleDateString()}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Aging
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-semibold",
            isOverdue ? "text-red-600" : "text-gray-700"
          )}>
            <Clock className="w-4 h-4" />
            {request.agingDays} days
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="space-y-3">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Overall Clearance Progress
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {request.clearanceProgress.completed}/{request.clearanceProgress.total}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              {request.clearanceProgress.completed} completed
            </span>
            <span>
              {request.clearanceProgress.pending} pending
            </span>
            {request.clearanceProgress.overdue > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-3 h-3" />
                {request.clearanceProgress.overdue} overdue
              </span>
            )}
          </div>
        </div>

        {/* My Items Progress (Role-specific) */}
        {request.ownedItems.total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-blue-700">
                My Items ({userRole})
              </span>
              <span className="text-sm font-bold text-blue-700">
                {request.ownedItems.completed}/{request.ownedItems.total}
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  ownedProgressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${ownedProgressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Last Activity */}
      {request.lastActivity && (
        <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
          <strong>Last Activity:</strong> {request.lastActivity.action} by {request.lastActivity.actor}{' '}
          ({new Date(request.lastActivity.timestamp).toLocaleDateString()})
        </div>
      )}
    </div>
  );
};

ExitRequestCard.displayName = 'ExitRequestCard';
