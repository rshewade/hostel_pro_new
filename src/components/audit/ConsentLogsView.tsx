'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Select } from '@/components/forms/Select';
import { Download, Search, FileText, Shield, CheckCircle, Upload, Clock } from 'lucide-react';

export type ConsentType = 'HOSTEL_RULES' | 'DPDP' | 'PARENT_CONSENT' | 'MEDICAL_CONSENT' | 'PHOTO_CONSENT' | 'TERMS_CONDITIONS';

export interface ConsentLogEntry {
  id: string;
  consentType: ConsentType;
  studentId: string;
  studentName: string;
  parentId?: string;
  parentName?: string;
  timestamp: string;
  expiryDate?: string;
  method: 'DIGITAL' | 'PHYSICAL_UPLOAD' | 'MANUAL_ENTRY';
  ipAddress?: string;
  version?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RENEWED';
  context: string;
  documentUrl?: string;
}

interface ConsentLogsViewProps {
  entries: ConsentLogEntry[];
  loading?: boolean;
  onExport?: () => void;
  onViewDocument?: (entryId: string) => void;
  onViewStudent?: (studentId: string) => void;
}

export const ConsentLogsView: React.FC<ConsentLogsViewProps> = ({
  entries,
  loading = false,
  onExport,
  onViewDocument,
  onViewStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConsentType | 'ALL'>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'DIGITAL' | 'PHYSICAL_UPLOAD' | 'MANUAL_ENTRY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RENEWED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const getConsentTypeLabel = (type: ConsentType): string => {
    switch (type) {
      case 'HOSTEL_RULES':
        return 'Hostel Rules';
      case 'DPDP':
        return 'DPDP Consent';
      case 'PARENT_CONSENT':
        return 'Parent Consent';
      case 'MEDICAL_CONSENT':
        return 'Medical Consent';
      case 'PHOTO_CONSENT':
        return 'Photo Consent';
      case 'TERMS_CONDITIONS':
        return 'Terms & Conditions';
      default:
        return type;
    }
  };

  const getStatusVariant = (status: ConsentLogEntry['status']): BadgeVariant => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'warning';
      case 'REVOKED':
        return 'error';
      case 'RENEWED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getMethodIcon = (method: ConsentLogEntry['method']) => {
    switch (method) {
      case 'DIGITAL':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PHYSICAL_UPLOAD':
        return <Upload className="w-4 h-4 text-blue-600" />;
      case 'MANUAL_ENTRY':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getConsentIcon = (type: ConsentType) => {
    switch (type) {
      case 'DPDP':
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-600" />;
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

  const isExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery === '' ||
        entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'ALL' || entry.consentType === typeFilter;
      const matchesMethod = methodFilter === 'ALL' || entry.method === methodFilter;
      const matchesStatus = statusFilter === 'ALL' || entry.status === statusFilter;
      return matchesSearch && matchesType && matchesMethod && matchesStatus;
    });
  }, [entries, searchQuery, typeFilter, methodFilter, statusFilter]);

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
          <span className="ml-3 text-gray-600">Loading consent logs...</span>
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
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ConsentType | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'HOSTEL_RULES', label: 'Hostel Rules' },
                { value: 'DPDP', label: 'DPDP Consent' },
                { value: 'PARENT_CONSENT', label: 'Parent Consent' },
                { value: 'MEDICAL_CONSENT', label: 'Medical Consent' },
                { value: 'PHOTO_CONSENT', label: 'Photo Consent' },
                { value: 'TERMS_CONDITIONS', label: 'Terms & Conditions' },
              ]}
              className="w-44"
            />
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
              options={[
                { value: 'ALL', label: 'All Methods' },
                { value: 'DIGITAL', label: 'Digital' },
                { value: 'PHYSICAL_UPLOAD', label: 'Physical Upload' },
                { value: 'MANUAL_ENTRY', label: 'Manual Entry' },
              ]}
              className="w-40"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'EXPIRED', label: 'Expired' },
                { value: 'REVOKED', label: 'Revoked' },
                { value: 'RENEWED', label: 'Renewed' },
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

      <div className="grid gap-4">
        {paginatedEntries.map((entry) => (
          <Card key={entry.id} padding="md" className="hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  {getConsentIcon(entry.consentType)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{getConsentTypeLabel(entry.consentType)}</h4>
                  <p className="text-sm text-gray-500">{entry.context}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Student</p>
                  <button
                    onClick={() => onViewStudent?.(entry.studentId)}
                    className="text-sm font-medium text-navy-700 hover:underline text-left"
                  >
                    {entry.studentName}
                  </button>
                  <p className="text-xs text-gray-500">{entry.studentId}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Timestamp</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{formatDateTime(entry.timestamp)}</span>
                  </div>
                  {entry.expiryDate && (
                    <p className={`text-xs mt-1 ${isExpired(entry.expiryDate) ? 'text-red-600' : 'text-gray-500'}`}>
                      Expires: {new Date(entry.expiryDate).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Method</p>
                  <div className="flex items-center gap-1 text-sm">
                    {getMethodIcon(entry.method)}
                    <span className="text-gray-900">
                      {entry.method.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                  {entry.ipAddress && (
                    <p className="text-xs text-gray-500 mt-1">IP: {entry.ipAddress}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                  <Badge variant={getStatusVariant(entry.status)} size="sm">
                    {entry.status}
                  </Badge>
                  {entry.version && (
                    <p className="text-xs text-gray-500 mt-1">v{entry.version}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 lg:self-center">
                {entry.documentUrl && (
                  <Button variant="ghost" size="xs" onClick={() => onViewDocument?.(entry.id)}>
                    View Document
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No consent logs found</p>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <Card padding="md">
          <div className="flex items-center justify-between">
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
        </Card>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 px-2">
        <span>Read-only consent audit log - Entries cannot be modified</span>
        <span>{filteredEntries.length} of {entries.length} entries shown</span>
      </div>
    </div>
  );
};

export default ConsentLogsView;
