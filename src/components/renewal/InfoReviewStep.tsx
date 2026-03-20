'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/forms/Input';
import { FormFieldWrapper } from '@/components/forms/InlineHelp';
import {
  WizardFormData,
  FormWizardProps,
} from '@/components/forms/FormWizard';
import { User, MapPin, Phone, Mail, Building, Calendar, Edit2, Eye, EyeOff } from 'lucide-react';

interface InfoReviewStepProps {
  data: WizardFormData;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
  saving?: boolean;
}

interface ReviewSection {
  title: string;
  icon: React.ReactNode;
  fields: {
    label: string;
    value: string;
    editable?: boolean;
    editUrl?: string;
  }[];
}

const sampleStudentData = {
  personal: {
    name: 'Amit Kumar Jain',
    email: 'amit.jain@email.com',
    mobile: '+91 98765 43210',
    dateOfBirth: '15 March 2004',
    gender: 'Male',
    aadharNumber: 'XXXX-XXXX-XXXX',
  },
  academic: {
    institution: 'Indian Institute of Technology',
    course: 'B.Tech',
    year: '2nd Year',
    rollNumber: 'IIT2023XXX',
  },
  hostel: {
    vertical: 'Boys Hostel',
    building: 'Block A',
    room: 'A-201',
    bed: 'A',
    joiningDate: '15 August 2024',
  },
  emergency: {
    contactName: 'Suresh Kumar Jain',
    relation: 'Father',
    mobile: '+91 98765 43211',
    alternateMobile: '+91 98765 43212',
  },
};

export const InfoReviewStep: React.FC<InfoReviewStepProps> = ({
  data,
  onChange,
  errors,
  setErrors,
  isValid,
  setIsValid,
  saving,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setIsValid(true);
  }, [setIsValid]);

  const sections: ReviewSection[] = [
    {
      title: 'Personal Information',
      icon: <User className="w-5 h-5" />,
      fields: [
        { label: 'Full Name', value: sampleStudentData.personal.name },
        { label: 'Email', value: sampleStudentData.personal.email },
        { label: 'Mobile', value: sampleStudentData.personal.mobile },
        { label: 'Date of Birth', value: sampleStudentData.personal.dateOfBirth },
        { label: 'Gender', value: sampleStudentData.personal.gender },
        { label: 'Aadhar Number', value: sampleStudentData.personal.aadharNumber },
      ],
    },
    {
      title: 'Academic Details',
      icon: <Building className="w-5 h-5" />,
      fields: [
        { label: 'Institution', value: sampleStudentData.academic.institution },
        { label: 'Course', value: sampleStudentData.academic.course },
        { label: 'Year', value: sampleStudentData.academic.year },
        { label: 'Roll Number', value: sampleStudentData.academic.rollNumber },
      ],
    },
    {
      title: 'Hostel Information',
      icon: <MapPin className="w-5 h-5" />,
      fields: [
        { label: 'Vertical', value: sampleStudentData.hostel.vertical },
        { label: 'Building', value: sampleStudentData.hostel.building },
        { label: 'Room Number', value: sampleStudentData.hostel.room },
        { label: 'Bed', value: sampleStudentData.hostel.bed },
        { label: 'Joining Date', value: sampleStudentData.hostel.joiningDate },
      ],
    },
    {
      title: 'Emergency Contact',
      icon: <Phone className="w-5 h-5" />,
      fields: [
        { label: 'Contact Name', value: sampleStudentData.emergency.contactName },
        { label: 'Relation', value: sampleStudentData.emergency.relation },
        { label: 'Mobile', value: sampleStudentData.emergency.mobile },
        { label: 'Alternate Mobile', value: sampleStudentData.emergency.alternateMobile },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Review Your Information
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Please review your personal, academic, and hostel information before proceeding with renewal.
          If any information is incorrect, please contact the administration.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">
              Information is Read-Only
            </p>
            <p className="text-sm text-blue-700">
              Your profile information cannot be edited here. If any details need to be updated,
              please visit the Student Affairs office or contact your superintendent.
            </p>
          </div>
        </div>
      </div>

      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} padding="md" shadow="sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <span style={{ color: 'var(--color-blue-600)' }}>{section.icon}</span>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {section.title}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="flex justify-between py-2 border-b md:border-0" style={{ borderColor: 'var(--border-secondary)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {field.label}
                </span>
                <span className="text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card padding="md" shadow="sm">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="confirmInfo"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              onChange('infoConfirmed', e.target.checked);
            }}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="confirmInfo" className="text-sm">
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              I confirm that the information above is correct
            </span>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              By checking this box, you confirm that all personal, academic, and hostel information
              is accurate. If any information changes during the renewal period, you will need to
              notify the administration.
            </p>
          </label>
        </div>
      </Card>

      {!confirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Edit2 className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">
                Confirmation Required
              </p>
              <p className="text-sm text-amber-700">
                Please confirm that your information is correct by checking the box above
                to proceed to the next step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoReviewStep;
