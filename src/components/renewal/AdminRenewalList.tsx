'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Table } from '@/components/data/Table';
import type { TableColumn } from '@/components/types';
import { RenewalStatusTracker } from './RenewalStatusTracker';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export interface RenewalApplication {
  id: string;
  studentId: string;
  studentName: string;
  vertical: string;
  room: string;
  type: 'NEW' | 'RENEWAL';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  daysRemaining: number;
  documentsUploaded: number;
  documentsRequired: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETE';
  amountDue: number;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface AdminRenewalListProps {
  title?: string;
  showVerticalFilter?: boolean;
  currentVertical?: string;
  onViewDetail: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  className?: string;
}

export const AdminRenewalList: React.FC<AdminRenewalListProps> = ({
  title = 'Renewal Applications',
  showVerticalFilter = true,
  currentVertical = 'All',
  onViewDetail,
  onApprove,
  onReject,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verticalFilter, setVerticalFilter] = useState(currentVertical);
  const [renewals, setRenewals] = useState<RenewalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRenewals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/renewals');

        if (!response.ok) {
          throw new Error('Failed to fetch renewals');
        }

        const result = await response.json();
        const data = result.data || result || [];

        const transformedRenewals: RenewalApplication[] = (Array.isArray(data) ? data : []).map((renewal: any) => ({
          id: renewal.id,
          studentId: renewal.student_id,
          studentName: renewal.student_name,
          vertical: renewal.vertical,
          room: renewal.room,
          type: renewal.type,
          status: renewal.status,
          daysRemaining: renewal.days_remaining,
          documentsUploaded: renewal.documents_uploaded,
          documentsRequired: renewal.documents_required,
          paymentStatus: renewal.payment_status,
          amountDue: renewal.amount_due,
          submittedAt: renewal.submitted_at,
          reviewedAt: renewal.reviewed_at,
        }));

        setRenewals(transformedRenewals);
        setError(null);
      } catch (err) {
        console.error('Error fetching renewals:', err);
        setError('Failed to load renewal applications.');
      } finally {
        setLoading(false);
      }
    };

    fetchRenewals();
  }, []);

  const filteredRenewals = renewals.filter((renewal) => {
    const matchesSearch =
      renewal.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      renewal.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      renewal.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || renewal.status === statusFilter;
    const matchesVertical = verticalFilter === 'All' || renewal.vertical === verticalFilter;

    return matchesSearch && matchesStatus && matchesVertical;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Badge variant="default" size="sm">Not Started</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning" size="sm">In Progress</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info" size="sm">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="error" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="error" size="sm">Pending</Badge>;
      case 'PARTIAL':
        return <Badge variant="warning" size="sm">Partial</Badge>;
      case 'COMPLETE':
        return <Badge variant="success" size="sm">Complete</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const columns: TableColumn<RenewalApplication>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '100px',
      render: (value) => (
        <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
          {value}
        </span>
      ),
    },
    {
      key: 'studentName',
      header: 'Student',
      render: (value, row) => (
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {row.studentId} | {row.room}
          </p>
        </div>
      ),
    },
    {
      key: 'vertical',
      header: 'Vertical',
      width: '120px',
      render: (value) => (
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '80px',
      render: (value) => (
        <Badge variant={value === 'NEW' ? 'info' : 'default'} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'documents',
      header: 'Documents',
      width: '100px',
      render: (value, row) => (
        <span className="text-sm">
          <span style={{ color: row.documentsUploaded === row.documentsRequired ? 'var(--color-green-600)' : 'var(--text-primary)' }}>
            {row.documentsUploaded}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>/{row.documentsRequired}</span>
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      width: '100px',
      render: (value, row) => (
        <div>
          {getPaymentBadge(row.paymentStatus)}
          {row.amountDue > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              ₹{row.amountDue.toLocaleString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'daysRemaining',
      header: 'Days Left',
      width: '90px',
      render: (value) => (
        <span
          className="text-sm font-medium"
          style={{
            color:
              value <= 7
                ? 'var(--color-red-600)'
                : value <= 15
                ? 'var(--color-amber-600)'
                : 'var(--text-primary)',
          }}
        >
          {value} days
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(row.id)}
            aria-label="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'UNDER_REVIEW' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onApprove(row.id)}
                aria-label="Approve"
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReject(row.id)}
                aria-label="Reject"
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const statusCounts = {
    all: renewals.length,
    IN_PROGRESS: renewals.filter((r) => r.status === 'IN_PROGRESS').length,
    UNDER_REVIEW: renewals.filter((r) => r.status === 'UNDER_REVIEW').length,
    APPROVED: renewals.filter((r) => r.status === 'APPROVED').length,
    REJECTED: renewals.filter((r) => r.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading renewal applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-2">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Review and process student renewal applications
          </p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
          Export
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by student name, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        {showVerticalFilter && (
          <div className="w-[180px]">
            <Select
              value={verticalFilter}
              onChange={(e) => setVerticalFilter(e.target.value)}
              options={[
                { value: 'All', label: 'All Verticals' },
                { value: 'Boys Hostel', label: 'Boys Hostel' },
                { value: 'Girls Ashram', label: 'Girls Ashram' },
                { value: 'Dharamshala', label: 'Dharamshala' },
              ]}
            />
          </div>
        )}
        <div className="flex gap-2">
          {(['all', 'IN_PROGRESS', 'UNDER_REVIEW', 'APPROVED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white/50">
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Card padding="none" shadow="sm">
        <Table
          data={filteredRenewals}
          columns={columns}
          striped
          stickyHeader
          emptyMessage="No renewal applications found"
        />
      </Card>

      <div className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Showing {filteredRenewals.length} of {renewals.length} applications
      </div>
    </div>
  );
};

export default AdminRenewalList;
