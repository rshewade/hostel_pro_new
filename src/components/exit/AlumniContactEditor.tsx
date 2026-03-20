'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, User, Save, X, History, AlertCircle } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import type { AlumniContactInfo, ContactUpdateLog } from './types';

interface AlumniContactEditorProps {
  contactInfo: AlumniContactInfo;
  canEdit?: boolean;
  onSave: (updatedInfo: Partial<AlumniContactInfo>, reason: string) => Promise<void>;
  className?: string;
}

export const AlumniContactEditor: React.FC<AlumniContactEditorProps> = ({
  contactInfo,
  canEdit = false,
  onSave,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(contactInfo);
  const [updateReason, setUpdateReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const hasChanges = JSON.stringify(editedInfo) !== JSON.stringify(contactInfo);

  const handleSave = async () => {
    if (!hasChanges || !updateReason.trim()) return;

    setSaving(true);
    try {
      await onSave(editedInfo, updateReason);
      setIsEditing(false);
      setUpdateReason('');
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedInfo(contactInfo);
    setUpdateReason('');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <p className="text-xs text-gray-600 mt-1">
            Last updated: {formatDate(contactInfo.lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {contactInfo.updateHistory && contactInfo.updateHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              History ({contactInfo.updateHistory.length})
            </Button>
          )}
          {canEdit && !isEditing && (
            <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
              Edit Contact Info
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editedInfo.email}
                onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                className="input w-full"
                placeholder="email@example.com"
              />
            ) : (
              <div className="text-sm text-gray-900 py-2">{contactInfo.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editedInfo.phone}
                onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
                className="input w-full"
                placeholder="+91 XXXXX XXXXX"
              />
            ) : (
              <div className="text-sm text-gray-900 py-2">{contactInfo.phone}</div>
            )}
          </div>

          {(isEditing || contactInfo.alternatePhone) && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Alternate Phone (Optional)
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedInfo.alternatePhone || ''}
                  onChange={(e) => setEditedInfo({ ...editedInfo, alternatePhone: e.target.value })}
                  className="input w-full"
                  placeholder="+91 XXXXX XXXXX"
                />
              ) : (
                <div className="text-sm text-gray-900 py-2">{contactInfo.alternatePhone}</div>
              )}
            </div>
          )}
        </div>

        {/* Permanent Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Permanent Address
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Street Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedInfo.permanentAddress.street}
                  onChange={(e) =>
                    setEditedInfo({
                      ...editedInfo,
                      permanentAddress: { ...editedInfo.permanentAddress, street: e.target.value },
                    })
                  }
                  className="input w-full"
                />
              ) : (
                <div className="text-sm text-gray-900">{contactInfo.permanentAddress.street}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedInfo.permanentAddress.city}
                    onChange={(e) =>
                      setEditedInfo({
                        ...editedInfo,
                        permanentAddress: { ...editedInfo.permanentAddress, city: e.target.value },
                      })
                    }
                    className="input w-full"
                  />
                ) : (
                  <div className="text-sm text-gray-900">{contactInfo.permanentAddress.city}</div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedInfo.permanentAddress.state}
                    onChange={(e) =>
                      setEditedInfo({
                        ...editedInfo,
                        permanentAddress: { ...editedInfo.permanentAddress, state: e.target.value },
                      })
                    }
                    className="input w-full"
                  />
                ) : (
                  <div className="text-sm text-gray-900">{contactInfo.permanentAddress.state}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">PIN Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedInfo.permanentAddress.pincode}
                    onChange={(e) =>
                      setEditedInfo({
                        ...editedInfo,
                        permanentAddress: { ...editedInfo.permanentAddress, pincode: e.target.value },
                      })
                    }
                    className="input w-full"
                  />
                ) : (
                  <div className="text-sm text-gray-900">{contactInfo.permanentAddress.pincode}</div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Country</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedInfo.permanentAddress.country}
                    onChange={(e) =>
                      setEditedInfo({
                        ...editedInfo,
                        permanentAddress: { ...editedInfo.permanentAddress, country: e.target.value },
                      })
                    }
                    className="input w-full"
                  />
                ) : (
                  <div className="text-sm text-gray-900">{contactInfo.permanentAddress.country}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Emergency Contact
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedInfo.emergencyContact.name}
                  onChange={(e) =>
                    setEditedInfo({
                      ...editedInfo,
                      emergencyContact: { ...editedInfo.emergencyContact, name: e.target.value },
                    })
                  }
                  className="input w-full"
                />
              ) : (
                <div className="text-sm text-gray-900">{contactInfo.emergencyContact.name}</div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Relationship</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedInfo.emergencyContact.relationship}
                  onChange={(e) =>
                    setEditedInfo({
                      ...editedInfo,
                      emergencyContact: { ...editedInfo.emergencyContact, relationship: e.target.value },
                    })
                  }
                  className="input w-full"
                />
              ) : (
                <div className="text-sm text-gray-900">{contactInfo.emergencyContact.relationship}</div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedInfo.emergencyContact.phone}
                  onChange={(e) =>
                    setEditedInfo({
                      ...editedInfo,
                      emergencyContact: { ...editedInfo.emergencyContact, phone: e.target.value },
                    })
                  }
                  className="input w-full"
                />
              ) : (
                <div className="text-sm text-gray-900">{contactInfo.emergencyContact.phone}</div>
              )}
            </div>
          </div>
        </div>

        {/* Update Reason (when editing) */}
        {isEditing && hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-900">
                  Reason for Update Required
                </h4>
                <p className="text-xs text-yellow-800 mt-1">
                  All contact information changes are logged for audit purposes.
                  Please provide a brief reason for this update.
                </p>
              </div>
            </div>
            <textarea
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              rows={3}
              className="input w-full text-sm"
              placeholder="e.g., New phone number, Updated address after relocation, etc."
            />
          </div>
        )}

        {/* Action Buttons (when editing) */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={handleCancel} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges || !updateReason.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Update History */}
      {showHistory && contactInfo.updateHistory && contactInfo.updateHistory.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Update History</h4>
          <div className="space-y-2">
            {contactInfo.updateHistory.map((log) => (
              <div
                key={log.logId}
                className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {log.field}: <span className="text-red-600">{log.oldValue}</span> →{' '}
                    <span className="text-green-600">{log.newValue}</span>
                  </div>
                  <div className="text-xs text-gray-600">{formatDate(log.timestamp)}</div>
                </div>
                <div className="text-xs text-gray-600">
                  Updated by: {log.updatedBy} ({log.updatedByRole})
                </div>
                {log.reason && (
                  <div className="text-xs text-gray-700 mt-1 italic">
                    Reason: {log.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

AlumniContactEditor.displayName = 'AlumniContactEditor';
