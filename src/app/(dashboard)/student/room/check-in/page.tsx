'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components';

// Types
type Allocation = {
  id: string;
  student_id: string;
  room_id: string;
  allocated_at: string;
  status: 'ACTIVE' | 'VACATED';
  check_in_confirmed: boolean;
};

type Room = {
  id: string;
  room_number: string;
  vertical: string;
  floor: number;
  capacity: number;
};

type InventoryItem = {
  id: string;
  name: string;
  expected_quantity: number;
  verified: boolean;
  actual_quantity: number;
  notes: string;
};

const DEFAULT_INVENTORY: Omit<InventoryItem, 'verified' | 'actual_quantity' | 'notes'>[] = [
  { id: 'bed', name: 'Bed with Mattress', expected_quantity: 1 },
  { id: 'table', name: 'Study Table', expected_quantity: 1 },
  { id: 'chair', name: 'Chair', expected_quantity: 1 },
  { id: 'cupboard', name: 'Cupboard', expected_quantity: 1 },
  { id: 'fan', name: 'Ceiling Fan', expected_quantity: 1 },
  { id: 'light', name: 'Light Fixture', expected_quantity: 1 },
  { id: 'windows', name: 'Windows (Working)', expected_quantity: 1 },
  { id: 'door_lock', name: 'Door Lock', expected_quantity: 1 },
];

export default function CheckInPage() {
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checklist states
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    DEFAULT_INVENTORY.map((item) => ({
      ...item,
      verified: false,
      actual_quantity: item.expected_quantity,
      notes: '',
    }))
  );
  const [roomConditionOk, setRoomConditionOk] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    // Get student ID from localStorage (stored during login)
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (userId) {
      setStudentId(userId);
    } else if (token) {
      try {
        // Fallback: try to decode from JWT token
        if (token.includes('.')) {
          const payload = token.split('.')[1];
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const tokenData = JSON.parse(atob(base64));
          setStudentId(tokenData.sub);
        } else {
          const tokenData = JSON.parse(atob(token));
          setStudentId(tokenData.userId);
        }
      } catch (e) {
        console.error('Error decoding token:', e);
        setError('Authentication error. Please login again.');
      }
    } else {
      setError('Please login to complete check-in.');
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      fetchAllocationData();
    }
  }, [studentId]);

  const fetchAllocationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student's allocation
      const allocationsResponse = await fetch(`/api/allocations?student_id=${studentId}`);
      const allocationsResult = await allocationsResponse.json();
      const allocationsData = allocationsResult.data || allocationsResult || [];

      const studentAllocation = (Array.isArray(allocationsData) ? allocationsData : []).find(
        (a: any) => (a.student_user_id === studentId || a.student_id === studentId) && a.status === 'ACTIVE'
      );

      if (!studentAllocation) {
        setError('No room allocation found.');
        setLoading(false);
        return;
      }

      if (studentAllocation.check_in_confirmed) {
        // Redirect to room page if already checked in
        window.location.href = '/dashboard/student/room';
        return;
      }

      setAllocation(studentAllocation);

      // Fetch room details
      const roomsResponse = await fetch('/api/rooms');
      const roomsResult = await roomsResponse.json();
      const roomsList = roomsResult.data || roomsResult || [];
      const roomData = (Array.isArray(roomsList) ? roomsList : []).find((r: Room) => r.id === studentAllocation.room_id);

      if (roomData) {
        setRoom(roomData);
      }
    } catch (err) {
      console.error('Error fetching allocation data:', err);
      setError('Failed to load room information.');
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryToggle = (id: string) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, verified: !item.verified } : item))
    );
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, actual_quantity: Math.max(0, quantity) } : item))
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, notes } : item)));
  };

  const handleSubmitCheckIn = async () => {
    // Validation
    const unverifiedItems = inventory.filter((item) => !item.verified);
    if (unverifiedItems.length > 0) {
      setError('Please verify all inventory items before proceeding.');
      return;
    }

    if (!roomConditionOk) {
      setError('Please confirm the room condition is acceptable.');
      return;
    }

    if (!rulesAccepted) {
      setError('Please accept the room rules and regulations.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // In production, this would call a dedicated check-in API endpoint
      // For now, we'll update the allocation directly
      const response = await fetch(`/api/allocations/${allocation?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in_confirmed: true,
          check_in_confirmed_at: new Date().toISOString(),
          inventory_acknowledged: true,
          inventory_acknowledged_at: new Date().toISOString(),
          notes: additionalNotes,
          metadata: { check_in_inventory: inventory },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm check-in');
      }

      // Redirect to room page on success
      window.location.href = '/dashboard/student/room?checked_in=true';
    } catch (err) {
      console.error('Error submitting check-in:', err);
      setError('Failed to complete check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <div className="text-heading-3 mb-2" style={{ color: 'var(--text-primary)' }}>
            Loading...
          </div>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            Preparing check-in process
          </p>
        </div>
      </div>
    );
  }

  if (error && !allocation) {
    return (
      <div className="min-h-screen p-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-lg border border-red-200 bg-red-50">
            <h2 className="text-heading-3 text-red-700 mb-2">Unable to Process Check-in</h2>
            <p className="text-body text-red-600">{error}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => (window.location.href = '/dashboard/student/room')}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allItemsVerified = inventory.every((item) => item.verified);
  const canSubmit = allItemsVerified && roomConditionOk && rulesAccepted && !submitting;

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Room Check-in
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            Complete the inventory verification and confirm your check-in for Room {room?.room_number}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-body-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Progress
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--surface-secondary)' }}>
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${
                        ((inventory.filter((i) => i.verified).length / inventory.length) * 100 +
                          (roomConditionOk ? 20 : 0) +
                          (rulesAccepted ? 20 : 0)) /
                        1.4
                      }%`,
                    }}
                  />
                </div>
                <div className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {Math.round(
                    ((inventory.filter((i) => i.verified).length / inventory.length) * 100 +
                      (roomConditionOk ? 20 : 0) +
                      (rulesAccepted ? 20 : 0)) /
                      1.4
                  )}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
            <p className="text-body text-red-700">{error}</p>
          </div>
        )}

        {/* Inventory Checklist */}
        <div className="mb-6 p-6 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
            Inventory Verification
          </h2>
          <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            Please verify all items are present and in good condition. Report any discrepancies in the notes.
          </p>

          <div className="space-y-4">
            {inventory.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  item.verified ? 'border-green-500 bg-green-50' : ''
                }`}
                style={{
                  borderColor: item.verified ? undefined : 'var(--border-primary)',
                  background: item.verified ? undefined : 'var(--surface-secondary)',
                }}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={item.verified}
                    onChange={() => handleInventoryToggle(item.id)}
                    className="mt-1 w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                          Quantity:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.actual_quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded border text-center"
                          style={{
                            borderColor: 'var(--border-primary)',
                            background: 'var(--surface-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                          / {item.expected_quantity}
                        </span>
                      </div>
                    </div>

                    {item.actual_quantity !== item.expected_quantity && (
                      <div className="mb-2 text-body-sm text-orange-600">
                        ⚠️ Quantity mismatch - please add notes below
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Add notes if there are any issues..."
                      value={item.notes}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 rounded border text-body-sm"
                      style={{
                        borderColor: 'var(--border-primary)',
                        background: 'var(--surface-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Condition Confirmation */}
        <div className="mb-6 p-6 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <h2 className="text-heading-3 mb-4" style={{ color: 'var(--text-primary)' }}>
            Room Condition
          </h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={roomConditionOk}
              onChange={(e) => setRoomConditionOk(e.target.checked)}
              className="mt-1 w-5 h-5 cursor-pointer"
            />
            <div>
              <div className="text-body font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                I confirm that the room is in acceptable condition
              </div>
              <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                The room is clean, all fixtures are working, and there are no visible damages that were not reported
                above.
              </div>
            </div>
          </label>
        </div>

        {/* Rules and Regulations */}
        <div className="mb-6 p-6 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <h2 className="text-heading-3 mb-4" style={{ color: 'var(--text-primary)' }}>
            Rules and Regulations
          </h2>

          <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--surface-secondary)' }}>
            <ul className="space-y-2 text-body-sm" style={{ color: 'var(--text-primary)' }}>
              <li>• Keep the room clean and maintain proper hygiene</li>
              <li>• No smoking or consumption of alcohol/drugs in the premises</li>
              <li>• Respect quiet hours (10 PM - 6 AM)</li>
              <li>• Report any damages or maintenance issues immediately</li>
              <li>• Do not make structural changes without permission</li>
              <li>• Visitors must follow hostel guidelines</li>
              <li>• You are responsible for room items during your stay</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 cursor-pointer"
            />
            <div>
              <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                I accept and agree to follow all room rules and regulations
              </div>
            </div>
          </label>
        </div>

        {/* Additional Notes */}
        <div className="mb-6 p-6 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
          <h2 className="text-heading-3 mb-4" style={{ color: 'var(--text-primary)' }}>
            Additional Notes (Optional)
          </h2>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any other observations or requests..."
            rows={4}
            className="w-full px-3 py-2 rounded border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--surface-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitCheckIn}
            disabled={!canSubmit}
            loading={submitting}
            fullWidth
          >
            {submitting ? 'Confirming Check-in...' : 'Confirm Check-in'}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => (window.location.href = '/dashboard/student/room')}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>

        {!canSubmit && !submitting && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-body-sm text-yellow-700">
              Please complete all verifications to proceed with check-in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
