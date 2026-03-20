import {
  ExitRequestSummary,
  DashboardFilters,
  SortOption,
  ExitProgressState,
} from './types';

/**
 * Calculate progress state for an exit request
 */
export const getProgressState = (request: ExitRequestSummary): ExitProgressState => {
  const { clearanceProgress } = request;

  if (clearanceProgress.overdue > 0) {
    return 'OVERDUE';
  }

  if (clearanceProgress.completed === clearanceProgress.total) {
    return 'COMPLETED';
  }

  if (clearanceProgress.completed > 0) {
    return 'IN_PROGRESS';
  }

  return 'NOT_STARTED';
};

/**
 * Filter exit requests based on dashboard filters
 */
export const filterExitRequests = (
  requests: ExitRequestSummary[],
  filters: DashboardFilters
): ExitRequestSummary[] => {
  return requests.filter((request) => {
    // Vertical filter
    if (filters.vertical && request.vertical !== filters.vertical) {
      return false;
    }

    // Progress state filter
    if (filters.progressState) {
      const progressState = getProgressState(request);
      if (progressState !== filters.progressState) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const exitDate = new Date(request.requestedExitDate);
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);

      if (exitDate < fromDate || exitDate > toDate) {
        return false;
      }
    }

    // Search query filter (searches student name, ID, room)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = request.studentName.toLowerCase().includes(query);
      const matchesId = request.studentId.toLowerCase().includes(query);
      const matchesRoom = request.roomNumber.toLowerCase().includes(query);

      if (!matchesName && !matchesId && !matchesRoom) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort exit requests based on sort option
 */
export const sortExitRequests = (
  requests: ExitRequestSummary[],
  sortOption: SortOption
): ExitRequestSummary[] => {
  const sorted = [...requests];

  switch (sortOption) {
    case 'OLDEST_FIRST':
      return sorted.sort(
        (a, b) =>
          new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()
      );

    case 'NEWEST_FIRST':
      return sorted.sort(
        (a, b) =>
          new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
      );

    case 'EXIT_DATE_ASC':
      return sorted.sort(
        (a, b) =>
          new Date(a.requestedExitDate).getTime() -
          new Date(b.requestedExitDate).getTime()
      );

    case 'EXIT_DATE_DESC':
      return sorted.sort(
        (a, b) =>
          new Date(b.requestedExitDate).getTime() -
          new Date(a.requestedExitDate).getTime()
      );

    case 'HIGH_RISK_FIRST':
      return sorted.sort((a, b) => {
        // High risk first
        if (a.isHighRisk && !b.isHighRisk) return -1;
        if (!a.isHighRisk && b.isHighRisk) return 1;
        // Then by aging (oldest first)
        return b.agingDays - a.agingDays;
      });

    case 'PROGRESS_ASC':
      return sorted.sort((a, b) => {
        const aProgress =
          a.clearanceProgress.total > 0
            ? a.clearanceProgress.completed / a.clearanceProgress.total
            : 0;
        const bProgress =
          b.clearanceProgress.total > 0
            ? b.clearanceProgress.completed / b.clearanceProgress.total
            : 0;
        return aProgress - bProgress;
      });

    case 'PROGRESS_DESC':
      return sorted.sort((a, b) => {
        const aProgress =
          a.clearanceProgress.total > 0
            ? a.clearanceProgress.completed / a.clearanceProgress.total
            : 0;
        const bProgress =
          b.clearanceProgress.total > 0
            ? b.clearanceProgress.completed / b.clearanceProgress.total
            : 0;
        return bProgress - aProgress;
      });

    default:
      return sorted;
  }
};

/**
 * Calculate dashboard summary statistics
 */
export interface DashboardStats {
  totalRequests: number;
  pendingClearance: number;
  completedClearance: number;
  highRiskCount: number;
  myPendingItems: number;
  averageAgingDays: number;
}

export const calculateDashboardStats = (
  requests: ExitRequestSummary[]
): DashboardStats => {
  const totalRequests = requests.length;

  const pendingClearance = requests.filter(
    (r) => getProgressState(r) !== 'COMPLETED'
  ).length;

  const completedClearance = requests.filter(
    (r) => getProgressState(r) === 'COMPLETED'
  ).length;

  const highRiskCount = requests.filter((r) => r.isHighRisk).length;

  const myPendingItems = requests.reduce(
    (sum, r) => sum + r.ownedItems.pending,
    0
  );

  const averageAgingDays =
    totalRequests > 0
      ? Math.round(
          requests.reduce((sum, r) => sum + r.agingDays, 0) / totalRequests
        )
      : 0;

  return {
    totalRequests,
    pendingClearance,
    completedClearance,
    highRiskCount,
    myPendingItems,
    averageAgingDays,
  };
};
