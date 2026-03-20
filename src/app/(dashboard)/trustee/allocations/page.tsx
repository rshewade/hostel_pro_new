'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/data/Table';
import { Spinner } from '@/components/feedback/Spinner';
import type { TableColumn } from '@/components/types';
import { cn } from '@/components/utils';
import { BedDouble, CheckCircle, Clock, Home } from 'lucide-react';
import { AllocationModal, type Application, type Vertical } from '../_components';

interface PendingAllocation {
  id: string;
  applicantName: string;
  trackingNumber: string;
  vertical: Vertical;
  approvedDate: string;
  status: 'PENDING' | 'ALLOCATED';
}

interface RoomSummary {
  vertical: Vertical;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
}

export default function TrusteeAllocations() {
  const [selectedVertical, setSelectedVertical] = useState<Vertical | 'ALL'>('ALL');
  const [pendingAllocations, setPendingAllocations] = useState<PendingAllocation[]>([]);
  const [roomSummary, setRoomSummary] = useState<RoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAllocation, setSelectedAllocation] = useState<Application | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch approved applications pending allocation
      const applicationsResponse = await fetch('/api/applications');
      const applicationsData = await applicationsResponse.json();
      const applications = Array.isArray(applicationsData) ? applicationsData : [];

      const pending: PendingAllocation[] = applications
        .filter((app: any) => app.status === 'APPROVED' || app.currentStatus === 'APPROVED')
        .map((app: any) => ({
          id: app.id,
          applicantName: app.firstName
            ? `${app.firstName} ${app.lastName || ''}`.trim()
            : app.data?.personal_info?.full_name || 'Unknown',
          trackingNumber: app.trackingNumber || app.tracking_number || app.id,
          vertical: (app.vertical || 'BOYS').toUpperCase() as Vertical,
          approvedDate: app.updatedAt
            ? new Date(app.updatedAt).toLocaleDateString('en-GB')
            : new Date().toLocaleDateString('en-GB'),
          status: 'PENDING' as const,
        }));

      setPendingAllocations(pending);

      // Fetch room summary
      const roomsResponse = await fetch('/api/rooms');
      const roomsData = await roomsResponse.json();
      const rooms = Array.isArray(roomsData) ? roomsData : roomsData.data || [];

      // Calculate room summary by vertical
      const summaryMap: Record<Vertical, RoomSummary> = {
        BOYS: { vertical: 'BOYS', totalRooms: 0, totalBeds: 0, occupiedBeds: 0, availableBeds: 0 },
        GIRLS: { vertical: 'GIRLS', totalRooms: 0, totalBeds: 0, occupiedBeds: 0, availableBeds: 0 },
        DHARAMSHALA: { vertical: 'DHARAMSHALA', totalRooms: 0, totalBeds: 0, occupiedBeds: 0, availableBeds: 0 },
      };

      // Map database vertical values to display values
      const mapVertical = (dbVertical: string): Vertical => {
        const mapping: Record<string, Vertical> = {
          'BOYS_HOSTEL': 'BOYS',
          'BOYS': 'BOYS',
          'GIRLS_ASHRAM': 'GIRLS',
          'GIRLS': 'GIRLS',
          'DHARAMSHALA': 'DHARAMSHALA',
        };
        return mapping[dbVertical?.toUpperCase()] || 'BOYS';
      };

      rooms.forEach((room: any) => {
        const vertical = mapVertical(room.vertical);
        if (summaryMap[vertical]) {
          summaryMap[vertical].totalRooms += 1;
          summaryMap[vertical].totalBeds += room.capacity || 0;
          summaryMap[vertical].occupiedBeds += room.occupied_count || 0;
          summaryMap[vertical].availableBeds += (room.capacity || 0) - (room.occupied_count || 0);
        }
      });

      setRoomSummary(Object.values(summaryMap));
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAllocations = pendingAllocations.filter(
    (allocation) => selectedVertical === 'ALL' || allocation.vertical === selectedVertical
  );

  const handleAllocate = async (applicationId: string, roomId: string) => {
    const response = await fetch('/api/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: applicationId,
        room_id: roomId,
      }),
    });

    if (response.ok) {
      // Update application status
      await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ALLOCATED',
          current_status: 'ALLOCATED',
        }),
      });
      await fetchData();
    } else {
      throw new Error('Failed to allocate room');
    }
  };

  const columns: TableColumn<PendingAllocation>[] = [
    {
      key: 'applicantName',
      header: 'Student',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      render: (value: string) => <span className="font-mono text-xs">{value}</span>,
    },
    {
      key: 'vertical',
      header: 'Vertical',
      render: (value: Vertical) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            value === 'BOYS' && 'bg-blue-100 text-blue-700',
            value === 'GIRLS' && 'bg-pink-100 text-pink-700',
            value === 'DHARAMSHALA' && 'bg-yellow-100 text-yellow-700'
          )}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'approvedDate',
      header: 'Approved Date',
      render: (value: string) => <span className="text-sm">{value}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'ALLOCATED' ? 'success' : 'warning'} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: PendingAllocation) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            // Convert to Application type for the modal
            const app: Application = {
              id: row.id,
              trackingNumber: row.trackingNumber,
              applicantName: row.applicantName,
              vertical: row.vertical,
              status: 'APPROVED',
              applicationDate: row.approvedDate,
              paymentStatus: 'PAID',
              interviewScheduled: true,
            };
            setSelectedAllocation(app);
            setShowAllocationModal(true);
          }}
        >
          <BedDouble className="w-4 h-4 mr-1" />
          Allocate
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>
          Loading allocations...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border" style={{ background: 'var(--color-red-50)', borderColor: 'var(--color-red-200)' }}>
        <p className="font-medium text-red-700">Error loading data</p>
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Room Allocations
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Allocate rooms to approved students
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {/* Room Availability Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {roomSummary.map((summary) => (
          <div
            key={summary.vertical}
            className="p-4 rounded-lg"
            style={{ background: 'var(--surface-primary)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {summary.vertical === 'BOYS' ? 'Boys Hostel' : summary.vertical === 'GIRLS' ? 'Girls Ashram' : 'Dharamshala'}
              </h3>
              <Home
                className={cn(
                  'w-5 h-5',
                  summary.vertical === 'BOYS' && 'text-blue-600',
                  summary.vertical === 'GIRLS' && 'text-pink-600',
                  summary.vertical === 'DHARAMSHALA' && 'text-yellow-600'
                )}
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Rooms:</span>
                <span className="font-medium">{summary.totalRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Beds:</span>
                <span className="font-medium">{summary.totalBeds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Occupied:</span>
                <span className="font-medium text-red-600">{summary.occupiedBeds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium text-green-600">{summary.availableBeds}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      summary.vertical === 'BOYS' && 'bg-blue-500',
                      summary.vertical === 'GIRLS' && 'bg-pink-500',
                      summary.vertical === 'DHARAMSHALA' && 'bg-yellow-500'
                    )}
                    style={{ width: `${summary.totalBeds > 0 ? (summary.occupiedBeds / summary.totalBeds) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {summary.totalBeds > 0 ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) : 0}% occupied
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {pendingAllocations.length}
              </p>
              <p className="text-sm text-gray-500">Pending Allocation</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {roomSummary.reduce((acc, s) => acc + s.availableBeds, 0)}
              </p>
              <p className="text-sm text-gray-500">Beds Available</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <BedDouble className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {roomSummary.reduce((acc, s) => acc + s.totalRooms, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Rooms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Filter */}
      <div className="p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Filter by Vertical:
          </label>
          {(['ALL', 'BOYS', 'GIRLS', 'DHARAMSHALA'] as const).map((vertical) => (
            <button
              key={vertical}
              onClick={() => setSelectedVertical(vertical)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                selectedVertical === vertical
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              )}
            >
              {vertical === 'ALL' ? 'All' : vertical}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Allocations Table */}
      {filteredAllocations.length === 0 ? (
        <div className="p-12 text-center rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <BedDouble className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No pending allocations</p>
          <p className="text-sm text-gray-500">
            All approved students have been allocated rooms, or there are no approved applications.
          </p>
        </div>
      ) : (
        <Table<PendingAllocation>
          data={filteredAllocations}
          columns={columns}
          pagination={{
            currentPage: 1,
            pageSize: 10,
            totalItems: filteredAllocations.length,
            totalPages: Math.ceil(filteredAllocations.length / 10),
            onPageChange: () => {},
          }}
          density="normal"
          striped={true}
        />
      )}

      {/* Allocation Modal */}
      <AllocationModal
        isOpen={showAllocationModal}
        onClose={() => {
          setShowAllocationModal(false);
          setSelectedAllocation(null);
        }}
        application={selectedAllocation}
        onAllocate={handleAllocate}
      />
    </div>
  );
}
