'use client';

import { FormWizard, Input, Select, DatePicker, FileUpload } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, FileText, User, GraduationCap, Home, Users, Upload, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { LanguageToggle } from '@/components/language-toggle';
import type { Locale } from '@/i18n/config';
import { useState, useEffect } from 'react';

export default function ApplicationFormPage() {
  const t = useTranslations('Public.applicationForm');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>({});

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = localStorage.getItem('application_draft_boys-hostel');
        if (savedDraft) {
          setInitialData(JSON.parse(savedDraft));
        } else {
          setInitialData({ vertical: 'boys-hostel' });
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
        setInitialData({ vertical: 'boys-hostel' });
      }
      setIsLoading(false);
    };

    loadDraft();
  }, []);

  const wizardSteps = [
    {
      id: 'personal-details',
      title: t('personalDetails'),
      component: ({
        data,
        onChange,
        errors,
        setErrors,
        isValid,
        setIsValid,
        saving,
      }: any) => (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-blue-100)' }}>
              <User className="w-6 h-6" style={{ color: 'var(--color-blue-600)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('personalInfo')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('personalInfoSubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('firstName')}
              value={data.firstName || ''}
              onChange={(e) => onChange('firstName', e.target.value)}
              error={errors.firstName}
              required
              placeholder={t('firstNamePlaceholder')}
            />

            <Input
              label={t('middleName')}
              value={data.middleName || ''}
              onChange={(e) => onChange('middleName', e.target.value)}
              placeholder={t('middleNamePlaceholder')}
            />

            <Input
              label={t('lastName')}
              value={data.lastName || ''}
              onChange={(e) => onChange('lastName', e.target.value)}
              error={errors.lastName}
              required
              placeholder={t('lastNamePlaceholder')}
            />

            <DatePicker
              label={t('dateOfBirth')}
              value={data.dob || ''}
              onChange={(e) => onChange('dob', e.target.value)}
              error={errors.dob}
              required
              helperText={t('dobHelperText')}
            />

            <Select
              label={t('gender')}
              value={data.gender || ''}
              onChange={(e) => onChange('gender', e.target.value)}
              error={errors.gender}
              required
              options={[
                { value: '', label: t('selectGender') },
                { value: 'male', label: t('male') },
                { value: 'female', label: t('female') },
                { value: 'other', label: t('other') },
              ]}
            />

            <Select
              label={t('bloodGroup')}
              value={data.bloodGroup || ''}
              onChange={(e) => onChange('bloodGroup', e.target.value)}
              error={errors.bloodGroup}
              required
              options={[
                { value: '', label: t('selectBloodGroup') },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('permanentAddress')}
            </h3>
            <div className="space-y-4">
              <Input
                label={t('addressLine1')}
                value={data.addressLine1 || ''}
                onChange={(e) => onChange('addressLine1', e.target.value)}
                error={errors.addressLine1}
                required
                placeholder={t('addressLine1Placeholder')}
              />

              <Input
                label={t('addressLine2')}
                value={data.addressLine2 || ''}
                onChange={(e) => onChange('addressLine2', e.target.value)}
                placeholder={t('addressLine2Placeholder')}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={t('city')}
                  value={data.city || ''}
                  onChange={(e) => onChange('city', e.target.value)}
                  error={errors.city}
                  required
                  placeholder={t('cityPlaceholder')}
                />

                <Input
                  label={t('state')}
                  value={data.state || ''}
                  onChange={(e) => onChange('state', e.target.value)}
                  error={errors.state}
                  required
                  placeholder={t('statePlaceholder')}
                />

                <Input
                  label={t('pinCode')}
                  type="text"
                  value={data.pinCode || ''}
                  onChange={(e) => onChange('pinCode', e.target.value)}
                  error={errors.pinCode}
                  required
                  placeholder={t('pinCodePlaceholder')}
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('parentGuardianInfo')}
            </h3>
            <div className="space-y-4">
              <Input
                label={t('fatherName')}
                value={data.fatherName || ''}
                onChange={(e) => onChange('fatherName', e.target.value)}
                error={errors.fatherName}
                required
                placeholder={t('fatherNamePlaceholder')}
              />

              <Input
                label={t('fatherOccupation')}
                value={data.fatherOccupation || ''}
                onChange={(e) => onChange('fatherOccupation', e.target.value)}
                placeholder={t('fatherOccupationPlaceholder')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('fatherMobile')}
                  type="tel"
                  value={data.fatherMobile || ''}
                  onChange={(e) => onChange('fatherMobile', e.target.value)}
                  error={errors.fatherMobile}
                  required
                  placeholder={t('mobileNumberPlaceholder')}
                  maxLength={10}
                  inputMode="tel"
                />

                <Input
                  label={t('fatherEmail')}
                  type="email"
                  value={data.fatherEmail || ''}
                  onChange={(e) => onChange('fatherEmail', e.target.value)}
                  placeholder={t('fatherEmailPlaceholder')}
                />
              </div>

              <Input
                label={t('motherName')}
                value={data.motherName || ''}
                onChange={(e) => onChange('motherName', e.target.value)}
                error={errors.motherName}
                required
                placeholder={t('motherNamePlaceholder')}
              />

              <Input
                label={t('motherOccupation')}
                value={data.motherOccupation || ''}
                onChange={(e) => onChange('motherOccupation', e.target.value)}
                placeholder={t('motherOccupationPlaceholder')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('motherMobile')}
                  type="tel"
                  value={data.motherMobile || ''}
                  onChange={(e) => onChange('motherMobile', e.target.value)}
                  placeholder={t('motherMobilePlaceholder')}
                  maxLength={10}
                  inputMode="tel"
                />

                <Input
                  label={t('motherEmail')}
                  type="email"
                  value={data.motherEmail || ''}
                  onChange={(e) => onChange('motherEmail', e.target.value)}
                  placeholder={t('fatherEmailPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('localGuardian')}
            </h3>
            <div className="space-y-4">
              <Input
                label={t('guardianName')}
                value={data.guardianName || ''}
                onChange={(e) => onChange('guardianName', e.target.value)}
                placeholder={t('guardianNamePlaceholder')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('guardianRelationship')}
                  value={data.guardianRelationship || ''}
                  onChange={(e) => onChange('guardianRelationship', e.target.value)}
                  placeholder={t('guardianRelationshipPlaceholder')}
                />

                <Input
                  label={t('guardianMobile')}
                  type="tel"
                  value={data.guardianMobile || ''}
                  onChange={(e) => onChange('guardianMobile', e.target.value)}
                  placeholder={t('mobileNumberPlaceholder')}
                  maxLength={10}
                  inputMode="tel"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('emergencyContact')}
            </h3>
            <div className="space-y-4">
              <Input
                label={t('emergencyContactPerson')}
                value={data.emergencyContactPerson || ''}
                onChange={(e) => onChange('emergencyContactPerson', e.target.value)}
                error={errors.emergencyContactPerson}
                required
                placeholder={t('emergencyContactPersonPlaceholder')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('emergencyMobile')}
                  type="tel"
                  value={data.emergencyMobile || ''}
                  onChange={(e) => onChange('emergencyMobile', e.target.value)}
                  error={errors.emergencyMobile}
                  required
                  placeholder={t('mobileNumberPlaceholder')}
                  maxLength={10}
                  inputMode="tel"
                />

                <Input
                  label={t('guardianRelationship')}
                  value={data.emergencyRelationship || ''}
                  onChange={(e) => onChange('emergencyRelationship', e.target.value)}
                  error={errors.emergencyRelationship}
                  required
                  placeholder={t('emergencyRelationshipPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>
      ),
      validate: (data: any) => {
        const errors: any = {};
        if (!data.firstName?.trim()) errors.firstName = 'First name is required';
        if (!data.lastName?.trim()) errors.lastName = 'Last name is required';
        if (!data.dob) errors.dob = 'Date of birth is required';
        if (!data.gender) errors.gender = 'Gender is required';
        if (!data.bloodGroup) errors.bloodGroup = 'Blood group is required';
        if (!data.addressLine1?.trim()) errors.addressLine1 = 'Address line 1 is required';
        if (!data.city?.trim()) errors.city = 'City is required';
        if (!data.state?.trim()) errors.state = 'State is required';
        if (!data.pinCode?.trim() || !/^\d{6}$/.test(data.pinCode)) {
          errors.pinCode = 'Valid 6-digit PIN code is required';
        }
        if (!data.fatherName?.trim()) errors.fatherName = 'Father name is required';
        if (!data.fatherMobile?.trim() || !/^\d{10}$/.test(data.fatherMobile)) {
          errors.fatherMobile = 'Valid 10-digit mobile number is required';
        }
        if (!data.motherName?.trim()) errors.motherName = 'Mother name is required';
        if (!data.emergencyContactPerson?.trim()) errors.emergencyContactPerson = 'Emergency contact person is required';
        if (!data.emergencyMobile?.trim() || !/^\d{10}$/.test(data.emergencyMobile)) {
          errors.emergencyMobile = 'Valid 10-digit emergency mobile is required';
        }
        if (!data.emergencyRelationship?.trim()) errors.emergencyRelationship = 'Relationship is required';
        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'academic-info',
      title: t('academicInfo'),
      description: 'Educational details',
      component: ({ data, onChange, errors }: any) => (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-green-100)' }}>
              <GraduationCap className="w-6 h-6" style={{ color: 'var(--color-green-600)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('academicDetails')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('academicDetailsSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label={t('institution')}
              value={data.institution || ''}
              onChange={(e) => onChange('institution', e.target.value)}
              error={errors.institution}
              required
              placeholder={t('institutionPlaceholder')}
            />

            <Input
              label={t('course')}
              value={data.course || ''}
              onChange={(e) => onChange('course', e.target.value)}
              error={errors.course}
              required
              placeholder={t('coursePlaceholder')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t('yearSemester')}
                value={data.year || ''}
                onChange={(e) => onChange('year', e.target.value)}
                error={errors.year}
                required
                options={[
                  { value: '', label: t('selectYear') },
                  { value: '1', label: t('year1') },
                  { value: '2', label: t('year2') },
                  { value: '3', label: t('year3') },
                  { value: '4', label: t('year4') },
                  { value: '5', label: t('year5') },
                ]}
              />

              <Input
                label={t('percentage')}
                value={data.percentage || ''}
                onChange={(e) => onChange('percentage', e.target.value)}
                error={errors.percentage}
                required
                placeholder={t('percentagePlaceholder')}
                inputMode="decimal"
              />
            </div>

            <Input
              label={t('previousQualification')}
              value={data.qualification || ''}
              onChange={(e) => onChange('qualification', e.target.value)}
              error={errors.qualification}
              required
              placeholder={t('previousQualificationPlaceholder')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('boardUniversity')}
                value={data.board || ''}
                onChange={(e) => onChange('board', e.target.value)}
                error={errors.board}
                required
                placeholder={t('boardUniversityPlaceholder')}
              />

              <Input
                label={t('passingYear')}
                type="number"
                value={data.passingYear || ''}
                onChange={(e) => onChange('passingYear', e.target.value)}
                error={errors.passingYear}
                required
                placeholder={t('passingYearPlaceholder')}
              />
            </div>
          </div>
        </div>
      ),
      validate: (data: any) => {
        const errors: any = {};
        if (!data.institution?.trim()) errors.institution = 'Institution name is required';
        if (!data.course?.trim()) errors.course = 'Course name is required';
        if (!data.year) errors.year = 'Year is required';
        if (!data.percentage?.trim()) errors.percentage = 'Percentage/CGPA is required';
        if (!data.qualification?.trim()) errors.qualification = 'Qualification is required';
        if (!data.board?.trim()) errors.board = 'Board/University is required';
        if (!data.passingYear) errors.passingYear = 'Passing year is required';
        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'hostel-preferences',
      title: t('hostelPreferences'),
      description: 'Room and duration preferences',
      component: ({ data, onChange, errors }: any) => (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-amber-100)' }}>
              <Home className="w-6 h-6" style={{ color: 'var(--color-amber-600)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('hostelPreferences')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('hostelPreferencesSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Select
              label={t('vertical')}
              value={data.vertical || 'boys-hostel'}
              onChange={(e) => onChange('vertical', e.target.value)}
              disabled
              helperText={t('verticalHelperText')}
              options={[
                { value: 'boys-hostel', label: t('boysHostel') },
                { value: 'dharamshala', label: t('dharamshala') },
                { value: 'dharamshala', label: t('dharamshala') },
              ]}
            />

            <Select
              label={t('preferredRoomType')}
              value={data.roomType || ''}
              onChange={(e) => onChange('roomType', e.target.value)}
              error={errors.roomType}
              required
              helperText={t('roomTypeHelperText')}
              options={[
                { value: '', label: t('selectRoomType') },
                { value: '2-sharing', label: '2-Sharing' },
                { value: '3-sharing', label: '3-Sharing' },
                { value: '4-sharing', label: '4-Sharing' },
              ]}
            />

            <Select
              label={t('durationOfStay')}
              value={data.duration || ''}
              onChange={(e) => onChange('duration', e.target.value)}
              error={errors.duration}
              required
              options={[
                { value: '', label: t('selectDuration') },
                { value: '6-months', label: '6 Months' },
                { value: '1-year', label: '1 Year' },
                { value: '2-years', label: '2 Years' },
                { value: '3-years', label: '3 Years' },
                { value: '4-years', label: '4 Years' },
              ]}
            />

            <DatePicker
              label={t('intendedJoiningDate')}
              value={data.joiningDate || ''}
              onChange={(e) => onChange('joiningDate', e.target.value)}
              error={errors.joiningDate}
              required
              helperText={t('joiningDateHelperText')}
            />

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('specialRequirements')}
              </label>
              <textarea
                value={data.specialRequirements || ''}
                onChange={(e) => onChange('specialRequirements', e.target.value)}
                placeholder={t('specialRequirementsPlaceholder')}
                className="w-full px-4 py-3 border rounded-lg text-base min-h-[100px]"
                style={{
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--surface-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                {t('specialRequirementsHelperText')}
              </p>
            </div>
          </div>
        </div>
      ),
      validate: (data: any) => {
        const errors: any = {};
        if (!data.roomType) errors.roomType = 'Room type is required';
        if (!data.duration) errors.duration = 'Duration is required';
        if (!data.joiningDate) errors.joiningDate = 'Joining date is required';
        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'references',
      title: t('references'),
      description: 'Ex-student references',
      component: ({ data, onChange, errors }: any) => (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-purple-100)' }}>
              <Users className="w-6 h-6" style={{ color: 'var(--color-purple-600)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('references')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('referencesSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('reference1')}
              </h3>
              <div className="space-y-4">
                <Input
                  label={t('exStudentName')}
                  value={data.ref1Name || ''}
                  onChange={(e) => onChange('ref1Name', e.target.value)}
                  error={errors.ref1Name}
                  required
                  placeholder={t('exStudentNamePlaceholder')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('mobileNumber')}
                    type="tel"
                    value={data.ref1Mobile || ''}
                    onChange={(e) => onChange('ref1Mobile', e.target.value)}
                    error={errors.ref1Mobile}
                    required
                    placeholder={t('mobileNumberPlaceholder')}
                    maxLength={10}
                    inputMode="tel"
                  />

                  <Input
                    label={t('yearOfStay')}
                    value={data.ref1Year || ''}
                    onChange={(e) => onChange('ref1Year', e.target.value)}
                    error={errors.ref1Year}
                    required
                    placeholder={t('yearOfStayPlaceholder1')}
                  />
                </div>

                <Input
                  label={t('relationshipOptional')}
                  value={data.ref1Relationship || ''}
                  onChange={(e) => onChange('ref1Relationship', e.target.value)}
                  placeholder={t('relationshipPlaceholder')}
                />
              </div>
            </div>

            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('reference2')}
              </h3>
              <div className="space-y-4">
                <Input
                  label={t('exStudentName')}
                  value={data.ref2Name || ''}
                  onChange={(e) => onChange('ref2Name', e.target.value)}
                  placeholder={t('exStudentNamePlaceholder')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('mobileNumber')}
                    type="tel"
                    value={data.ref2Mobile || ''}
                    onChange={(e) => onChange('ref2Mobile', e.target.value)}
                    placeholder={t('mobileNumberPlaceholder')}
                    maxLength={10}
                    inputMode="tel"
                  />

                  <Input
                    label={t('yearOfStay')}
                    value={data.ref2Year || ''}
                    onChange={(e) => onChange('ref2Year', e.target.value)}
                    placeholder={t('yearOfStayPlaceholder2')}
                  />
                </div>

                <Input
                  label={t('relationshipOptional')}
                  value={data.ref2Relationship || ''}
                  onChange={(e) => onChange('ref2Relationship', e.target.value)}
                  placeholder={t('relationshipPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>
      ),
      validate: (data: any) => {
        const errors: any = {};
        if (!data.ref1Name?.trim()) errors.ref1Name = 'Ex-student name is required';
        if (!data.ref1Mobile?.trim() || !/^\d{10}$/.test(data.ref1Mobile)) {
          errors.ref1Mobile = 'Valid 10-digit mobile number is required';
        }
        if (!data.ref1Year?.trim()) errors.ref1Year = 'Year of stay is required';
        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'documents',
      title: t('documents'),
      description: 'Upload required documents',
      component: ({ data, onChange, errors, saving }: any) => (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-blue-100)' }}>
              <Upload className="w-6 h-6" style={{ color: 'var(--color-blue-600)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('documentUpload')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('documentUploadSubtitle')}</p>
            </div>
          </div>

          <div className="card p-6 border-2" style={{ backgroundColor: 'var(--color-blue-50)', borderColor: 'var(--color-blue-200)' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-5 h-5" />
              {t('uploadGuidelines')}
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>{t('acceptedFormats')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>{t('maxFileSize')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>{t('ensureClear')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span>{t('dragAndDrop')}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <FileUpload
              label={t('recentPhoto')}
              value={data.photoFile || null}
              onChange={(file) => onChange('photoFile', file)}
              error={errors.photoFile}
              required
              accept=".jpg,.jpeg,.pdf"
              maxSize={5 * 1024 * 1024}
              showPreview={true}
            />

            <FileUpload
              label={t('birthCertificate')}
              value={data.birthCertificate || null}
              onChange={(file) => onChange('birthCertificate', file)}
              error={errors.birthCertificate}
              required
              accept=".jpg,.jpeg,.pdf"
              maxSize={5 * 1024 * 1024}
              showPreview={true}
            />

            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <FileUpload
                label={t('marksheet')}
                value={data.marksheet || null}
                onChange={(file) => onChange('marksheet', file)}
                error={errors.marksheet}
                required
                accept=".jpg,.jpeg,.pdf"
                maxSize={5 * 1024 * 1024}
                showPreview={true}
              />
            </div>

            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <FileUpload
                label={t('recommendationLetter')}
                value={data.recommendationLetter || null}
                onChange={(file) => onChange('recommendationLetter', file)}
                accept=".jpg,.jpeg,.pdf"
                maxSize={5 * 1024 * 1024}
                showPreview={true}
              />
            </div>
          </div>
        </div>
      ),
      validate: (data: any) => {
        const errors: any = {};
        if (!data.photoFile) errors.photoFile = 'Photo is required';
        if (!data.birthCertificate) errors.birthCertificate = 'Birth certificate is required';
        if (!data.marksheet) errors.marksheet = 'Marksheet is required';
        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'review',
      title: t('reviewApplication'),
      description: 'Review before submitting',
      component: ({ data }: any) => (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-green-100)' }}>
              <CheckCircle className="w-6 h-6" style={{ color: 'var(--color-green-600)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('reviewApplication')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('reviewSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('personalDetails')}
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {data.firstName} {data.middleName} {data.lastName}</p>
                <p><strong>Date of Birth:</strong> {data.dob}</p>
                <p><strong>Gender:</strong> {data.gender}</p>
                <p><strong>Blood Group:</strong> {data.bloodGroup}</p>
                <p><strong>Address:</strong> {data.addressLine1}, {data.addressLine2}, {data.city}, {data.state} - {data.pinCode}</p>
                <p><strong>Father:</strong> {data.fatherName} ({data.fatherMobile})</p>
                <p><strong>Mother:</strong> {data.motherName} ({data.motherMobile})</p>
                <p><strong>Emergency Contact:</strong> {data.emergencyContactPerson} ({data.emergencyMobile})</p>
              </div>
            </div>

            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('academicInfo')}
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Institution:</strong> {data.institution}</p>
                <p><strong>Course:</strong> {data.course}</p>
                <p><strong>Year:</strong> {data.year}</p>
                <p><strong>Percentage/CGPA:</strong> {data.percentage}</p>
                <p><strong>Qualification:</strong> {data.qualification}</p>
                <p><strong>Board/University:</strong> {data.board}</p>
                <p><strong>Passing Year:</strong> {data.passingYear}</p>
              </div>
            </div>

            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('hostelPreferences')}
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Vertical:</strong> {data.vertical === 'boys-hostel' ? 'Boys Hostel' : data.vertical === 'dharamshala' ? 'Dharamshala' : 'Dharamshala'}</p>
                <p><strong>Room Type:</strong> {data.roomType}</p>
                <p><strong>Duration:</strong> {data.duration}</p>
                <p><strong>Joining Date:</strong> {data.joiningDate}</p>
                {data.specialRequirements && (
                  <p><strong>Special Requirements:</strong> {data.specialRequirements}</p>
                )}
              </div>
            </div>

            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('reference1')}
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {data.ref1Name}</p>
                <p><strong>Mobile:</strong> {data.ref1Mobile}</p>
                <p><strong>Year of Stay:</strong> {data.ref1Year}</p>
                {data.ref1Relationship && <p><strong>Relationship:</strong> {data.ref1Relationship}</p>}
              </div>
            </div>

            {data.ref2Name && (
              <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {t('reference2')}
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {data.ref2Name}</p>
                  <p><strong>Mobile:</strong> {data.ref2Mobile}</p>
                  <p><strong>Year of Stay:</strong> {data.ref2Year}</p>
                  {data.ref2Relationship && <p><strong>Relationship:</strong> {data.ref2Relationship}</p>}
                </div>
              </div>
            )}

            <div className="card p-6 border-2" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('documents')}
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Photo:</strong> {data.photoFile?.name || 'Not uploaded'}</p>
                <p><strong>Birth Certificate:</strong> {data.birthCertificate?.name || 'Not uploaded'}</p>
                <p><strong>Marksheet:</strong> {data.marksheet?.name || 'Not uploaded'}</p>
                {data.recommendationLetter && (
                  <p><strong>Recommendation Letter:</strong> {data.recommendationLetter.name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6 border-2" style={{ backgroundColor: 'var(--color-blue-50)', borderColor: 'var(--color-blue-200)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('declaration')}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {t('declarationText')}
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                required
              />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('agreeTerms')}
              </span>
            </label>
          </div>
        </div>
      ),
      validate: (data: any) => {
        return null;
      },
    },
  ];

  const handleSaveDraft = async (data: any, step: number) => {
    try {
      localStorage.setItem('application_draft_boys-hostel', JSON.stringify(data));
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw new Error('Failed to save draft locally');
    }
  };

  const uploadDocument = async (file: File, documentType: string, tempId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('temp_id', tempId);

    const response = await fetch('/api/applications/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to upload ${documentType}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || `Failed to upload ${documentType}`);
    }

    return result.data;
  };

  const handleSubmit = async (data: any) => {
    try {
      // Generate a temporary ID for this application's documents
      const tempId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      // Document fields that need to be uploaded
      const documentFields = ['photoFile', 'birthCertificate', 'marksheet', 'recommendationLetter'];
      const uploadedDocuments: Record<string, any> = {};

      // Upload all documents first
      for (const fieldName of documentFields) {
        const file = data[fieldName];
        if (file instanceof File) {
          try {
            const uploadResult = await uploadDocument(file, fieldName, tempId);
            uploadedDocuments[fieldName] = uploadResult;
          } catch (uploadError: any) {
            console.error(`Failed to upload ${fieldName}:`, uploadError);
            throw new Error(`Failed to upload ${fieldName}: ${uploadError.message}`);
          }
        }
      }

      // Prepare submission data - replace File objects with upload info
      const submissionData = { ...data };
      for (const fieldName of documentFields) {
        if (uploadedDocuments[fieldName]) {
          submissionData[fieldName] = uploadedDocuments[fieldName];
        } else {
          delete submissionData[fieldName];
        }
      }

      // Add documents array for the API
      submissionData.documents = Object.entries(uploadedDocuments).map(([fieldName, docInfo]) => ({
        type: fieldName,
        ...docInfo,
      }));

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submissionData,
          vertical: 'dharamshala',
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        const errorMessage = errorData.message || errorData.error || 'Failed to submit application';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      localStorage.removeItem('application_draft_dharamshala');
      // API response wraps data in { success: true, data: {...} }
      const trackingNumber = result.data?.trackingNumber || result.data?.tracking_number || result.trackingNumber;
      window.location.href = `/apply/dharamshala/success?trackingNumber=${trackingNumber}`;
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      alert(`Failed to submit application: ${error.message || 'Please try again.'}`);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>{t('loadingForm')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="flex justify-end p-4">
        <LanguageToggle currentLocale={locale as Locale} />
      </div>
      <header
        className="px-6 py-4 border-b"
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/apply" className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                {t('dharamshalaBooking')}
              </h1>
              <p className="text-caption">{t('applicationForm')}</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="nav-link">{t('home')}</Link>
            <Link href="/apply" className="nav-link">{t('applyNow')}</Link>
            <Link href="/check-status" className="nav-link">{t('checkStatus')}</Link>
            <Link href="/login" className="nav-link">{t('login')}</Link>
          </nav>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <FormWizard
            steps={wizardSteps}
            initialData={initialData}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            onSubmitLabel={t('submitApplication')}
          />
        </div>
      </main>
    </div>
  );
}
