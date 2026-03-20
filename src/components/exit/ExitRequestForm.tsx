'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Calendar, MapPin, Phone, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '../utils';
import { ExitStatus } from './ExitStatusBadge';

export interface ExitRequestData {
  desiredExitDate: string;
  reason: string;
  forwardingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  preferredContact: {
    phone: string;
    email: string;
    whatsapp?: string;
  };
  additionalNotes?: string;
}

interface ExitRequestFormProps {
  initialData?: Partial<ExitRequestData>;
  currentStatus: ExitStatus;
  onSubmit: (data: ExitRequestData) => void | Promise<void>;
  onSaveDraft?: (data: Partial<ExitRequestData>) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export const ExitRequestForm: React.FC<ExitRequestFormProps> = ({
  initialData,
  currentStatus,
  onSubmit,
  onSaveDraft,
  onCancel,
  className,
}) => {
  const [formData, setFormData] = useState<Partial<ExitRequestData>>(
    initialData || {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form is editable only in DRAFT status
  const isEditable = currentStatus === 'DRAFT';

  // Limited edit window: can edit within 24 hours of submission
  const canRequestEdit = currentStatus === 'SUBMITTED';

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }

      // Handle nested fields
      const [parent, child] = keys;
      const parentValue = prev[parent as keyof ExitRequestData];
      return {
        ...prev,
        [parent]: {
          ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
          [child]: value,
        },
      };
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.desiredExitDate) {
      newErrors.desiredExitDate = 'Exit date is required';
    } else {
      const exitDate = new Date(formData.desiredExitDate);
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + 30); // 30 days minimum notice

      if (exitDate < minDate) {
        newErrors.desiredExitDate = 'Exit date must be at least 30 days from today';
      }
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason is required (minimum 10 characters)';
    }

    // Forwarding address validation
    if (!formData.forwardingAddress?.street) {
      newErrors['forwardingAddress.street'] = 'Street address is required';
    }
    if (!formData.forwardingAddress?.city) {
      newErrors['forwardingAddress.city'] = 'City is required';
    }
    if (!formData.forwardingAddress?.state) {
      newErrors['forwardingAddress.state'] = 'State is required';
    }
    if (!formData.forwardingAddress?.pincode) {
      newErrors['forwardingAddress.pincode'] = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.forwardingAddress.pincode)) {
      newErrors['forwardingAddress.pincode'] = 'Invalid pincode format (6 digits)';
    }

    // Contact validation
    if (!formData.preferredContact?.phone) {
      newErrors['preferredContact.phone'] = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.preferredContact.phone)) {
      newErrors['preferredContact.phone'] = 'Invalid phone number format';
    }

    if (!formData.preferredContact?.email) {
      newErrors['preferredContact.email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.preferredContact.email)) {
      newErrors['preferredContact.email'] = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData as ExitRequestData);
    } catch (error) {
      console.error('Error submitting exit request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    setSaving(true);
    try {
      await onSaveDraft(formData);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Desired Exit Date */}
      <div>
        <label htmlFor="desiredExitDate" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          <Calendar className="w-4 h-4 inline mr-1" />
          Desired Exit Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="desiredExitDate"
          value={formData.desiredExitDate || ''}
          onChange={(e) => handleChange('desiredExitDate', e.target.value)}
          disabled={!isEditable}
          className={cn(
            'input w-full',
            errors.desiredExitDate && 'border-red-500',
            !isEditable && 'bg-gray-100 cursor-not-allowed'
          )}
          min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
        />
        {errors.desiredExitDate && (
          <p className="text-sm text-red-600 mt-1">{errors.desiredExitDate}</p>
        )}
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Minimum 30 days notice required from today
        </p>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Reason for Exit <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          rows={4}
          value={formData.reason || ''}
          onChange={(e) => handleChange('reason', e.target.value)}
          disabled={!isEditable}
          placeholder="Please provide a detailed reason for your exit request..."
          className={cn(
            'input w-full',
            errors.reason && 'border-red-500',
            !isEditable && 'bg-gray-100 cursor-not-allowed'
          )}
        />
        {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason}</p>}
      </div>

      {/* Forwarding Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Forwarding Address <span className="text-red-500">*</span>
          </h3>
        </div>

        <div>
          <label htmlFor="street" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Street Address
          </label>
          <input
            type="text"
            id="street"
            value={formData.forwardingAddress?.street || ''}
            onChange={(e) => handleChange('forwardingAddress.street', e.target.value)}
            disabled={!isEditable}
            className={cn(
              'input w-full',
              errors['forwardingAddress.street'] && 'border-red-500',
              !isEditable && 'bg-gray-100 cursor-not-allowed'
            )}
          />
          {errors['forwardingAddress.street'] && (
            <p className="text-sm text-red-600 mt-1">{errors['forwardingAddress.street']}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.forwardingAddress?.city || ''}
              onChange={(e) => handleChange('forwardingAddress.city', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'input w-full',
                errors['forwardingAddress.city'] && 'border-red-500',
                !isEditable && 'bg-gray-100 cursor-not-allowed'
              )}
            />
            {errors['forwardingAddress.city'] && (
              <p className="text-sm text-red-600 mt-1">{errors['forwardingAddress.city']}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              State
            </label>
            <input
              type="text"
              id="state"
              value={formData.forwardingAddress?.state || ''}
              onChange={(e) => handleChange('forwardingAddress.state', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'input w-full',
                errors['forwardingAddress.state'] && 'border-red-500',
                !isEditable && 'bg-gray-100 cursor-not-allowed'
              )}
            />
            {errors['forwardingAddress.state'] && (
              <p className="text-sm text-red-600 mt-1">{errors['forwardingAddress.state']}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="pincode" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Pincode
          </label>
          <input
            type="text"
            id="pincode"
            maxLength={6}
            value={formData.forwardingAddress?.pincode || ''}
            onChange={(e) => handleChange('forwardingAddress.pincode', e.target.value)}
            disabled={!isEditable}
            className={cn(
              'input w-full md:w-48',
              errors['forwardingAddress.pincode'] && 'border-red-500',
              !isEditable && 'bg-gray-100 cursor-not-allowed'
            )}
          />
          {errors['forwardingAddress.pincode'] && (
            <p className="text-sm text-red-600 mt-1">{errors['forwardingAddress.pincode']}</p>
          )}
        </div>
      </div>

      {/* Preferred Contact */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Preferred Contact <span className="text-red-500">*</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              maxLength={10}
              value={formData.preferredContact?.phone || ''}
              onChange={(e) => handleChange('preferredContact.phone', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'input w-full',
                errors['preferredContact.phone'] && 'border-red-500',
                !isEditable && 'bg-gray-100 cursor-not-allowed'
              )}
            />
            {errors['preferredContact.phone'] && (
              <p className="text-sm text-red-600 mt-1">{errors['preferredContact.phone']}</p>
            )}
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              WhatsApp Number (Optional)
            </label>
            <input
              type="tel"
              id="whatsapp"
              maxLength={10}
              value={formData.preferredContact?.whatsapp || ''}
              onChange={(e) => handleChange('preferredContact.whatsapp', e.target.value)}
              disabled={!isEditable}
              className={cn('input w-full', !isEditable && 'bg-gray-100 cursor-not-allowed')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            <Mail className="w-4 h-4 inline mr-1" />
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={formData.preferredContact?.email || ''}
            onChange={(e) => handleChange('preferredContact.email', e.target.value)}
            disabled={!isEditable}
            className={cn(
              'input w-full',
              errors['preferredContact.email'] && 'border-red-500',
              !isEditable && 'bg-gray-100 cursor-not-allowed'
            )}
          />
          {errors['preferredContact.email'] && (
            <p className="text-sm text-red-600 mt-1">{errors['preferredContact.email']}</p>
          )}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="additionalNotes" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Additional Notes (Optional)
        </label>
        <textarea
          id="additionalNotes"
          rows={3}
          value={formData.additionalNotes || ''}
          onChange={(e) => handleChange('additionalNotes', e.target.value)}
          disabled={!isEditable}
          placeholder="Any additional information you'd like to share..."
          className={cn('input w-full', !isEditable && 'bg-gray-100 cursor-not-allowed')}
        />
      </div>

      {/* Warning for non-editable state */}
      {!isEditable && !canRequestEdit && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Form Locked</p>
            <p className="text-sm text-yellow-700 mt-1">
              This exit request cannot be edited in its current status. Contact the administrator if you need to make changes.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
        <div>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting || saving}>
              Cancel
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isEditable && onSaveDraft && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={submitting || saving}
              loading={saving}
            >
              Save as Draft
            </Button>
          )}

          {isEditable && (
            <Button type="submit" variant="primary" disabled={submitting || saving} loading={submitting}>
              Submit Exit Request
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

ExitRequestForm.displayName = 'ExitRequestForm';
