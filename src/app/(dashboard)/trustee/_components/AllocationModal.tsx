'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/feedback/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/feedback/Spinner';
import type { Application, Vertical } from './ApplicationReviewModal';

interface Room {
  id: string;
  room_number: string;
  vertical: Vertical;
  capacity: number;
  occupied_count: number;
  floor: number;
  amenities?: string[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
}

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onAllocate: (applicationId: string, roomId: string) => Promise<void>;
}

export function AllocationModal({
  isOpen,
  onClose,
  application,
  onAllocate,
}: AllocationModalProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && application) {
      fetchAvailableRooms(application.vertical);
    }
  }, [isOpen, application]);

  const fetchAvailableRooms = async (vertical: Vertical) => {
    setIsLoading(true);
    try {
      // Map display vertical to database vertical format
      const dbVerticalMap: Record<Vertical, string> = {
        'BOYS': 'BOYS_HOSTEL',
        'GIRLS': 'GIRLS_ASHRAM',
        'DHARAMSHALA': 'DHARAMSHALA',
      };
      const dbVertical = dbVerticalMap[vertical] || vertical;
      const response = await fetch(`/api/rooms?vertical=${dbVertical}`);
      if (response.ok) {
        const data = await response.json();
        const roomsList = data.data || data || [];
        // Filter for available rooms
        const availableRooms = roomsList.filter(
          (room: Room) => room.status !== 'MAINTENANCE' && room.occupied_count < room.capacity
        );
        setRooms(availableRooms);
      }
    } catch {
      setError('Failed to fetch available rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!application || !selectedRoom) {
      setError('Please select a room');
      return;
    }

    setIsAllocating(true);
    setError(null);
    try {
      await onAllocate(application.id, selectedRoom);
      setSelectedRoom(null);
      onClose();
    } catch {
      setError('Failed to allocate room. Please try again.');
    } finally {
      setIsAllocating(false);
    }
  };

  if (!application) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Allocate Room"
      size="lg"
    >
      <div className="space-y-6">
        {/* Application Summary */}
        <div className="p-4 rounded border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-gray-200)' }}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-600">Student</label>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {application.applicantName}
              </p>
            </div>
            <div>
              <label className="text-gray-600">Tracking Number</label>
              <p className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                {application.trackingNumber}
              </p>
            </div>
            <div>
              <label className="text-gray-600">Vertical</label>
              <Badge
                variant={application.vertical === 'BOYS' ? 'success' : application.vertical === 'GIRLS' ? 'warning' : 'info'}
                size="sm"
                className="mt-1"
              >
                {application.vertical}
              </Badge>
            </div>
            <div>
              <label className="text-gray-600">Status</label>
              <Badge variant="success" size="sm" className="mt-1">
                APPROVED
              </Badge>
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div>
          <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Available Rooms ({application.vertical})
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
              <span className="ml-2 text-gray-600">Loading available rooms...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No available rooms found for {application.vertical}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    selectedRoom === room.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Room {room.room_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        Floor {room.floor} | Occupancy: {room.occupied_count}/{room.capacity}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={room.occupied_count === 0 ? 'success' : 'warning'}
                        size="sm"
                      >
                        {room.capacity - room.occupied_count} beds available
                      </Badge>
                      {room.amenities && room.amenities.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {room.amenities.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Room Summary */}
        {selectedRoom && (
          <div className="p-3 rounded border-l-4 bg-green-50 border-green-500">
            <p className="text-sm text-green-800">
              <strong>Selected:</strong> Room{' '}
              {rooms.find((r) => r.id === selectedRoom)?.room_number}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded border-l-4 bg-red-50 border-red-500">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-gray-200)' }}>
          <Button
            variant="primary"
            onClick={handleAllocate}
            loading={isAllocating}
            disabled={!selectedRoom}
          >
            Allocate Room
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
