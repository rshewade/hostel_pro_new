'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Calendar, Filter, Download, Search, Mail, MessageCircle, Smartphone, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export type CommunicationChannel = 'whatsapp' | 'sms' | 'email';
export type CommunicationStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING';
export type CommunicationContext = 'fee' | 'interview' | 'leave' | 'renewal' | 'admission' | 'general';

export interface CommunicationLogEntry {
  id: string;
  dateTime: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  recipients: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  channel: CommunicationChannel;
  status: CommunicationStatus;
  context: CommunicationContext;
  template?: string;
  message: string;
  recipientCount: number;
}

interface CommunicationLogTableProps {
  entries: CommunicationLogEntry[];
  loading?: boolean;
  onExport?: () => void;
  onViewDetails?: (entryId: string) => void;
}

export const CommunicationLogTable: React.FC<CommunicationLogTableProps> = ({
  entries,
  loading = false,
  onExport,
  onViewDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommunicationStatus | 'ALL'>('ALL');
  const [channelFilter, setChannelFilter] = useState<CommunicationChannel | 'ALL'>('ALL');
  const [contextFilter, setContextFilter] = useState<CommunicationContext | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'ALL'>('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const getStatusVariant = (status: CommunicationStatus): BadgeVariant => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return 'success';
      case 'READ':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'sms':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-gray-600" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getContextColor = (context: CommunicationContext): string => {
    switch (context) {
      case 'fee':
        return 'text-purple-700 bg-purple-50';
      case 'interview':
        return 'text-amber-700 bg-amber-50';
      case 'leave':
        return 'text-blue-700 bg-blue-50';
      case 'renewal':
        return 'text-green-700 bg-green-50';
      case 'admission':
        return 'text-indigo-700 bg-indigo-50';
      default:
        return 'text-gray-700 bg-gray-50';
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

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery === '' ||
        entry.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.recipients.some((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || entry.status === statusFilter;
      const matchesChannel = channelFilter === 'ALL' || entry.channel === channelFilter;
      const matchesContext = contextFilter === 'ALL' || entry.context === contextFilter;
      return matchesSearch && matchesStatus && matchesChannel && matchesContext;
    });
  }, [entries, searchQuery, statusFilter, channelFilter, contextFilter]);

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
          <span className="ml-3 text-gray-600">Loading communication logs...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by sender, recipient, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CommunicationStatus | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'SENT', label: 'Sent' },
                { value: 'DELIVERED', label: 'Delivered' },
                { value: 'READ', label: 'Read' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'FAILED', label: 'Failed' },
              ]}
              className="w-36"
            />
            <Select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as CommunicationChannel | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Channels' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'sms', label: 'SMS' },
                { value: 'email', label: 'Email' },
              ]}
              className="w-36"
            />
            <Select
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value as CommunicationContext | 'ALL')}
              options={[
                { value: 'ALL', label: 'All Context' },
                { value: 'fee', label: 'Fee' },
                { value: 'interview', label: 'Interview' },
                { value: 'leave', label: 'Leave' },
                { value: 'renewal', label: 'Renewal' },
                { value: 'admission', label: 'Admission' },
              ]}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              options={[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: 'ALL', label: 'All time' },
              ]}
              className="w-36"
            />
            {onExport && (
              <Button variant="secondary" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
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
                  Sender
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Context
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
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
                    <div>
                      <p className="font-medium text-gray-900">{entry.sender.name}</p>
                      <p className="text-xs text-gray-500">{entry.sender.role}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="text-gray-900">
                        {entry.recipients.length > 1
                          ? `${entry.recipients[0].name} +${entry.recipients.length - 1} others`
                          : entry.recipients[0]?.name}
                      </p>
                      <p className="text-xs text-gray-500">{entry.recipientCount} recipient(s)</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(entry.channel)}
                      <span className="capitalize">{entry.channel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getContextColor(
                        entry.context
                      )}`}
                    >
                      {entry.context}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={getStatusVariant(entry.status)} size="sm">
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="max-w-xs truncate text-gray-600" title={entry.message}>
                      {entry.message}
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
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No communication logs found</p>
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

export default CommunicationLogTable;
