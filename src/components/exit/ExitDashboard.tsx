'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  ListChecks,
  X,
} from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { ExitRequestCard } from './ExitRequestCard';
import {
  ExitRequestSummary,
  DashboardFilters,
  SortOption,
  ClearanceOwnerRole,
  HostelVertical,
  ExitProgressState,
} from './types';
import {
  filterExitRequests,
  sortExitRequests,
  calculateDashboardStats,
  DashboardStats,
} from './dashboardUtils';

interface ExitDashboardProps {
  requests: ExitRequestSummary[];
  userRole: ClearanceOwnerRole;
  onViewDetails: (requestId: string) => void;
  onBulkAction?: (requestIds: string[], action: string) => void;
  className?: string;
}

export const ExitDashboard: React.FC<ExitDashboardProps> = ({
  requests,
  userRole,
  onViewDetails,
  onBulkAction,
  className,
}) => {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [sortOption, setSortOption] = useState<SortOption>('HIGH_RISK_FIRST');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // Apply filters and sort
  const filteredAndSortedRequests = useMemo(() => {
    const activeFilters = { ...filters, searchQuery: searchQuery || undefined };
    const filtered = filterExitRequests(requests, activeFilters);
    return sortExitRequests(filtered, sortOption);
  }, [requests, filters, sortOption, searchQuery]);

  // Calculate statistics
  const stats: DashboardStats = useMemo(
    () => calculateDashboardStats(requests),
    [requests]
  );

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof DashboardFilters] !== undefined
  ).length;

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleToggleSelection = (requestId: string) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === filteredAndSortedRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredAndSortedRequests.map((r) => r.id));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-lg card">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Total Requests
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.totalRequests}
          </div>
        </div>

        <div className="p-4 rounded-lg card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Pending Clearance
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.pendingClearance}
          </div>
        </div>

        <div className="p-4 rounded-lg card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Completed
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.completedClearance}
          </div>
        </div>

        <div className="p-4 rounded-lg card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              High Risk
            </span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats.highRiskCount}
          </div>
        </div>

        <div className="p-4 rounded-lg card">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              My Pending Items
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.myPendingItems}
          </div>
        </div>

        <div className="p-4 rounded-lg card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Avg Aging
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.averageAgingDays}d
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or room..."
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="w-[200px]">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="input w-full"
            >
              <option value="HIGH_RISK_FIRST">High Risk First</option>
              <option value="OLDEST_FIRST">Oldest First</option>
              <option value="NEWEST_FIRST">Newest First</option>
              <option value="EXIT_DATE_ASC">Exit Date (Earliest)</option>
              <option value="EXIT_DATE_DESC">Exit Date (Latest)</option>
              <option value="PROGRESS_ASC">Progress (Low to High)</option>
              <option value="PROGRESS_DESC">Progress (High to Low)</option>
            </select>
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white text-blue-600 text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Bulk Actions */}
          {onBulkAction && selectedRequests.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => onBulkAction(selectedRequests, 'complete')}
            >
              Bulk Action ({selectedRequests.length})
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vertical Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Hostel Vertical
                </label>
                <select
                  value={filters.vertical || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      vertical: e.target.value ? (e.target.value as HostelVertical) : undefined,
                    })
                  }
                  className="input w-full"
                >
                  <option value="">All Verticals</option>
                  <option value="BOYS">Boys Hostel</option>
                  <option value="GIRLS">Girls Ashram</option>
                  <option value="DHARAMSHALA">Dharamshala</option>
                </select>
              </div>

              {/* Progress State Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Progress State
                </label>
                <select
                  value={filters.progressState || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      progressState: e.target.value
                        ? (e.target.value as ExitProgressState)
                        : undefined,
                    })
                  }
                  className="input w-full"
                >
                  <option value="">All States</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Exit Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.dateRange?.from || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          from: e.target.value,
                          to: filters.dateRange?.to || '',
                        },
                      })
                    }
                    className="input flex-1"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={filters.dateRange?.to || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          from: filters.dateRange?.from || '',
                          to: e.target.value,
                        },
                      })
                    }
                    className="input flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Exit Requests ({filteredAndSortedRequests.length})
        </h3>

        {onBulkAction && filteredAndSortedRequests.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            {selectedRequests.length === filteredAndSortedRequests.length
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        )}
      </div>

      {/* Request Cards */}
      {filteredAndSortedRequests.length === 0 ? (
        <div className="card p-12 text-center">
          <SlidersHorizontal className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No exit requests found
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {activeFilterCount > 0 || searchQuery
              ? 'Try adjusting your filters or search query'
              : 'No exit requests are currently in the system'}
          </p>
          {(activeFilterCount > 0 || searchQuery) && (
            <Button variant="secondary" size="sm" onClick={handleClearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedRequests.map((request) => (
            <div key={request.id} className="flex items-start gap-3">
              {onBulkAction && (
                <input
                  type="checkbox"
                  checked={selectedRequests.includes(request.id)}
                  onChange={() => handleToggleSelection(request.id)}
                  className="mt-6 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
              <div className="flex-1">
                <ExitRequestCard
                  request={request}
                  userRole={userRole}
                  onViewDetails={onViewDetails}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ExitDashboard.displayName = 'ExitDashboard';
