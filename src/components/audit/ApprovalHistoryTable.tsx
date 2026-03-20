'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Select } from '@/components/forms/Select';
import { Download, Search, Calendar, FileText, IndianRupee, RefreshCw } from 'lucide-react';

export type ApprovalEntityType = 'APPLICATION' | 'LEAVE' | 'PAYMENT' | 'RENEWAL';
export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'RETURNED' | 'PENDING';

export interface ApprovalHistoryEntry {
  id: string;
  dateTime: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityTitle: string;
  studentId: string;
  studentName: string;
  authority?: {
    id: string;
    name: string;
    role: string;
  };
  decision: ApprovalDecision;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  vertical: string;
}

interface ApprovalHistoryTableProps {
  entries: ApprovalHistoryEntry[];
  loading?: boolean;
  onExport?: () => void;
  onViewDetails?: (entryId: string) => void;
}

export const ApprovalHistoryTable: React.FC<ApprovalHistoryTableProps> = ({
  entries,
  loading = false,
  onExport,
  onViewDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<ApprovalEntityType | 'ALL'>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<ApprovalDecision | 'ALL'>('ALL');
  const [verticalFilter, setVerticalFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const getDecisionVariant = (decision: ApprovalDecision): BadgeVariant => {
    switch (decision) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'RETURNED':
        return 'warning';
      case 'PENDING':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEntityIcon = (entityType: ApprovalEntityType) => {
    switch (entityType) {
      case 'APPLICATION':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'LEAVE':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'PAYMENT':
        return <IndianRupee className="w-4 h-4 text-green-600" />;
      case 'RENEWAL':
        return <RefreshCw className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const verticals = useMemo(() => {
    const v = new Set(entries.map((e) => e.vertical).filter(Boolean));
    return Array.from(v);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery === '' ||
        entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.authority?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.entityId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEntity = entityFilter === 'ALL' || entry.entityType === entityFilter;
      const matchesDecision = decisionFilter === 'ALL' || entry.decision === decisionFilter;
      const matchesVertical = verticalFilter === 'ALL' || entry.vertical === verticalFilter;
      return matchesSearch && matchesEntity && matchesDecision && matchesVertical;
    });
  }, [entries, searchQuery, entityFilter, decisionFilter, verticalFilter]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700"></div>
          <span className="ml-3 text-gray-600">Loading approval history...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student, authority, or entity ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as ApprovalEntityType | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'APPLICATION', label: 'Application' },
                { value: 'LEAVE', label: 'Leave' },
                { value: 'PAYMENT', label: 'Payment' },
                { value: 'RENEWAL', label: 'Renewal' },
              ]}
              className="w-36"
            />
            <Select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as ApprovalDecision | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Decisions' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'RETURNED', label: 'Returned' },
                { value: 'PENDING', label: 'Pending' },
              ]}
              className="w-36"
            />
            <Select
              value={verticalFilter}
              onChange={(e) => setVerticalFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Verticals' },
                ...verticals.map((v) => ({ value: v, label: v })),
              ]}
              className="w-36"
            />
          </div>
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Decision
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {formatDateTime(entry.dateTime)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(entry.entityType)}
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {entry.entityType.toLowerCase().replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{entry.entityId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{entry.studentName}</p>
                      <p className="text-xs text-gray-500">{entry.studentId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{entry.authority?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{entry.authority?.role || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="space-y-1">
                      <Badge variant={getDecisionVariant(entry.decision)} size="sm">
                        {entry.decision}
                      </Badge>
                      {entry.previousStatus && entry.newStatus && (
                        <p className="text-xs text-gray-500">
                          {entry.previousStatus} → {entry.newStatus}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="max-w-xs truncate text-gray-600" title={entry.remarks}>
                      {entry.remarks || '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="ghost" size="xs" onClick={() => onViewDetails?.(entry.id)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No approval history found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredEntries.length)} of{' '}
              {filteredEntries.length} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between text-xs text-gray-500 px-2">
        <span>Read-only audit log - Entries cannot be modified</span>
        <span>{filteredEntries.length} of {entries.length} entries shown</span>
      </div>
    </div>
  );
};

export default ApprovalHistoryTable;
