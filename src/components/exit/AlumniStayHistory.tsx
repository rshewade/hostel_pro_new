'use client';

import React from 'react';
import { Calendar, Home, MapPin, RefreshCw } from 'lucide-react';
import { cn } from '../utils';
import type { StayHistorySummary } from './types';

interface AlumniStayHistoryProps {
  stayHistory: StayHistorySummary;
  className?: string;
}

export const AlumniStayHistory: React.FC<AlumniStayHistoryProps> = ({
  stayHistory,
  className,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Home className="w-5 h-5 text-purple-600" />
          Stay History Summary
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Complete hostel residency record
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-blue-700 font-medium">Vertical</div>
              <div className="text-sm font-semibold text-blue-900 mt-0.5">
                {stayHistory.vertical}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-green-700 font-medium">Total Duration</div>
              <div className="text-sm font-semibold text-green-900 mt-0.5">
                {stayHistory.totalDuration}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Stay Period</h4>
            {stayHistory.renewalCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                <RefreshCw className="w-3 h-3" />
                {stayHistory.renewalCount} Renewal{stayHistory.renewalCount > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Admission Date</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatDate(stayHistory.admissionDate)}
              </div>
            </div>
            <div className="flex-shrink-0 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Exit Date</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatDate(stayHistory.exitDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Room Allocations */}
        {stayHistory.roomAllocations && stayHistory.roomAllocations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Room Allocation History</h4>
            <div className="space-y-2">
              {stayHistory.roomAllocations.map((allocation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Home className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Room {allocation.roomNumber}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {formatDate(allocation.fromDate)} - {formatDate(allocation.toDate)}
                      </div>
                    </div>
                  </div>
                  {index === 0 && stayHistory.roomAllocations.length > 1 && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      Initial
                    </span>
                  )}
                  {index === stayHistory.roomAllocations.length - 1 && stayHistory.roomAllocations.length > 1 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Final
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {stayHistory.roomAllocations?.length || 1}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Room{stayHistory.roomAllocations && stayHistory.roomAllocations.length > 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stayHistory.renewalCount}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Renewal{stayHistory.renewalCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stayHistory.totalDuration.split(' ')[0]}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {stayHistory.totalDuration.split(' ')[1]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AlumniStayHistory.displayName = 'AlumniStayHistory';
