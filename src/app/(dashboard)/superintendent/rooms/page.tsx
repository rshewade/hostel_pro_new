'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components';
import { Select } from '@/components/forms/Select';
import { SearchField } from '@/components/forms/SearchField';
import AllocationModal from '@/components/AllocationModal';

// Types
type RoomStatus = 'AVAILABLE' | 'PARTIAL' | 'FULL' | 'MAINTENANCE';
type Vertical = 'BOYS_HOSTEL' | 'GIRLS_ASHRAM' | 'DHARAMSHALA';

type Room = {
  id: string;
  room_number: string;
  vertical: Vertical;
  floor: number;
  capacity: number;
  occupied_count: number;
  status: RoomStatus;
};

type Allocation = {
  id: string;
  student_id: string;
  room_id: string;
  allocated_at: string;
  status: string;
};

type Student = {
  id: string;
  full_name: string;
  bed_number?: number;
};

export default function RoomAllocationPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  // Filters
  const [verticalFilter, setVerticalFilter] = useState<string>('ALL');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();
    fetchAllocations();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setRooms(data.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      const response = await fetch('/api/allocations');
      const data = await response.json();
      setAllocations(data.data || []);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  // Calculate room status
  const getRoomStatus = (room: Room): RoomStatus => {
    if (room.status === 'MAINTENANCE') return 'MAINTENANCE';
    if (room.occupied_count === 0) return 'AVAILABLE';
    if (room.occupied_count >= room.capacity) return 'FULL';
    return 'PARTIAL';
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    // Vertical filter
    if (verticalFilter !== 'ALL' && room.vertical !== verticalFilter) {
      return false;
    }

    // Occupancy filter
    const status = getRoomStatus(room);
    if (occupancyFilter !== 'ALL') {
      if (occupancyFilter === 'EMPTY' && status !== 'AVAILABLE') return false;
      if (occupancyFilter === 'PARTIAL' && status !== 'PARTIAL') return false;
      if (occupancyFilter === 'FULL' && status !== 'FULL') return false;
      if (occupancyFilter === 'BLOCKED' && status !== 'MAINTENANCE') return false;
    }

    // Search filter
    if (searchQuery && !room.room_number.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setShowDetailPanel(true);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-heading-1 mb-2" style={{ color: 'var(--text-primary)' }}>
          Room Allocation Matrix
        </h1>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Manage room allocations across all verticals
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vertical Filter */}
          <Select
            label="Vertical"
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Verticals' },
              { value: 'BOYS_HOSTEL', label: 'Boys Hostel' },
              { value: 'GIRLS_ASHRAM', label: 'Girls Ashram' },
              { value: 'DHARAMSHALA', label: 'Dharamshala' },
            ]}
          />

          {/* Occupancy Filter */}
          <Select
            label="Occupancy Status"
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: 'EMPTY', label: 'Available' },
              { value: 'PARTIAL', label: 'Partially Occupied' },
              { value: 'FULL', label: 'Full' },
              { value: 'BLOCKED', label: 'Blocked' },
            ]}
          />

          {/* Search */}
          <SearchField
            label="Search Room"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Room number..."
            showClearButton
          />

          {/* Summary */}
          <div className="flex items-end">
            <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredRooms.length}</strong> rooms
            </div>
          </div>
        </div>
      </div>

      {/* Room Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms Grid */}
        <div className={showDetailPanel ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-secondary)' }}>Loading rooms...</p>
            </div>
          ) : Object.keys(roomsByFloor).length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-secondary)' }}>No rooms found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(roomsByFloor)
                .sort((a, b) => Number(a) - Number(b))
                .map((floor) => (
                  <div key={floor}>
                    <h2 className="text-heading-3 mb-4" style={{ color: 'var(--text-primary)' }}>
                      Floor {floor}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {roomsByFloor[Number(floor)].map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          status={getRoomStatus(room)}
                          onClick={() => handleRoomClick(room)}
                          isSelected={selectedRoom?.id === room.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {showDetailPanel && selectedRoom && (
          <div className="lg:col-span-1">
            <RoomDetailPanel
              room={selectedRoom}
              allocations={allocations.filter((a) => a.room_id === selectedRoom.id && a.status === 'ACTIVE')}
              onClose={() => {
                setShowDetailPanel(false);
                setSelectedRoom(null);
              }}
              onAllocate={() => {
                setShowAllocationModal(true);
              }}
              onRefresh={() => {
                fetchRooms();
                fetchAllocations();
              }}
            />
          </div>
        )}
      </div>

      {/* Allocation Modal */}
      {showAllocationModal && selectedRoom && (
        <AllocationModal
          room={selectedRoom}
          onClose={() => setShowAllocationModal(false)}
          onSuccess={() => {
            setShowAllocationModal(false);
            fetchRooms();
            fetchAllocations();
          }}
        />
      )}
    </div>
  );
}

// Room Card Component
function RoomCard({
  room,
  status,
  onClick,
  isSelected,
}: {
  room: Room;
  status: RoomStatus;
  onClick: () => void;
  isSelected: boolean;
}) {
  const statusConfig = {
    AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-700', icon: '🟢' },
    PARTIAL: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
    FULL: { label: 'Full', color: 'bg-red-100 text-red-700', icon: '🔴' },
    MAINTENANCE: { label: 'Blocked', color: 'bg-gray-100 text-gray-700', icon: '⚫' },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        background: 'var(--surface-primary)',
        borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-primary)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-heading-4" style={{ color: 'var(--text-primary)' }}>
            {room.room_number}
          </div>
          <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            {room.vertical.replace('_', ' ')}
          </div>
        </div>
        <span className="text-xl">{config.icon}</span>
      </div>

      <div className="mb-3">
        <div className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {room.occupied_count} / {room.capacity}
        </div>
        <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Occupancy
        </div>
      </div>

      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </div>
    </button>
  );
}

// Room Detail Panel Component
function RoomDetailPanel({
  room,
  allocations,
  onClose,
  onAllocate,
  onRefresh,
}: {
  room: Room;
  allocations: Allocation[];
  onClose: () => void;
  onAllocate: () => void;
  onRefresh: () => void;
}) {
  const [occupants, setOccupants] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOccupants();
  }, [allocations]);

  const fetchOccupants = async () => {
    try {
      // Fetch student profiles for each allocation
      const students = await Promise.all(
        allocations.map(async (allocation: any, index) => {
          // Handle both student_id and student_user_id field names
          const studentId = allocation.student_user_id || allocation.student_id;
          try {
            const response = await fetch(`/api/users/profile?user_id=${studentId}`);
            if (response.ok) {
              const result = await response.json();
              const userData = result.data || result;
              return {
                id: studentId || `occupant-${index}`,
                full_name: userData.full_name || userData.profile?.full_name || 'Unknown Student',
                bed_number: index + 1,
              };
            }
          } catch (error) {
            console.error('Error fetching student:', error);
          }
          return {
            id: studentId || `occupant-${index}`,
            full_name: 'Student',
            bed_number: index + 1,
          };
        })
      );
      setOccupants(students);
    } catch (error) {
      console.error('Error fetching occupants:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableBeds = room.capacity - room.occupied_count;

  return (
    <div className="sticky top-6 p-6 rounded-lg border" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-heading-3" style={{ color: 'var(--text-primary)' }}>
          Room {room.room_number}
        </h3>
        <button
          onClick={onClose}
          className="text-body hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          ✕
        </button>
      </div>

      {/* Room Info */}
      <div className="space-y-3 mb-6">
        <div>
          <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Floor
          </div>
          <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
            {room.floor}
          </div>
        </div>

        <div>
          <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Vertical
          </div>
          <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
            {room.vertical.replace('_', ' ')}
          </div>
        </div>

        <div>
          <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Capacity
          </div>
          <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
            {room.occupied_count} / {room.capacity} beds occupied
          </div>
          {availableBeds > 0 && (
            <div className="text-body-sm text-green-600">
              {availableBeds} bed{availableBeds > 1 ? 's' : ''} available
            </div>
          )}
        </div>
      </div>

      {/* Current Occupants */}
      <div className="mb-6">
        <h4 className="text-heading-4 mb-3" style={{ color: 'var(--text-primary)' }}>
          Current Occupants
        </h4>
        {loading ? (
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading...
          </p>
        ) : occupants.length === 0 ? (
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            No occupants currently
          </p>
        ) : (
          <div className="space-y-2">
            {occupants.map((student, index) => (
              <div
                key={`${student.id}-${index}`}
                className="p-3 rounded-md"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                  {student.full_name}
                </div>
                <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                  Bed {student.bed_number}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={onAllocate}
          disabled={availableBeds === 0}
        >
          {availableBeds > 0 ? 'Allocate Student' : 'Room Full'}
        </Button>

        <Button variant="secondary" size="sm" fullWidth onClick={onRefresh}>
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
