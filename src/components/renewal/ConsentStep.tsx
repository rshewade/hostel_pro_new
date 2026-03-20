'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/forms/Checkbox';
import { FormFieldWrapper } from '@/components/forms/InlineHelp';
import {
  WizardFormData,
} from '@/components/forms/FormWizard';
import {
  Shield,
  CheckCircle,
  InfoIcon,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ConsentStepProps {
  data: WizardFormData;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
  saving?: boolean;
}

const DPDP_CONSENT_TEXT = `
Data Protection and Privacy Principles (DPDP) Act - Consent Renewal

I hereby confirm and agree to the following:

1. DATA COLLECTION: I consent to the collection, storage, and processing of my personal data including but not limited to:
   - Personal identification information (name, address, contact details)
   - Academic records and performance data
   - Financial information for fee payments
   - Medical/health information for emergency purposes
   - Biometric data (if applicable in the future)

2. DATA USAGE: My data shall be used exclusively for:
   - Hostel admission and management purposes
   - Academic and administrative records
   - Fee collection and financial tracking
   - Communication regarding hostel matters
   - Emergency contact and safety purposes
   - Compliance with legal and regulatory requirements

3. DATA SHARING: I understand that my data may be shared with:
   - Institutional authorities for administrative purposes
   - Parent/guardian for communication and fee matters
   - Government agencies as required by law
   - Service providers for hostel operations (mess, security, maintenance)

4. DATA RETENTION: My data shall be retained:
   - During my stay at the hostel
   - For a period of 1 year after exit for alumni records
   - Financial records retained for 7 years as per legal requirements

5. DATA PROTECTION: I acknowledge that appropriate technical and organizational
   measures are in place to protect my data against unauthorized access,
   alteration, disclosure, or destruction.

6. MY RIGHTS: I understand I have the right to:
   - Access my personal data
   - Rectify inaccurate data
   - Request data deletion (subject to legal requirements)
   - Lodge complaints with the Data Protection Board

7. WITHDRAWAL: I understand I can withdraw this consent at any time by
   submitting a written request, though this may affect my ability to
   continue stay at the hostel.
`;

const CONSENT_POINTS = [
  {
    id: 'data_collection',
    title: 'Data Collection',
    description: 'I consent to the collection and storage of my personal, academic, and financial data.',
  },
  {
    id: 'data_usage',
    title: 'Data Usage',
    description: 'I understand my data will be used for hostel management, communication, and compliance purposes.',
  },
  {
    id: 'data_sharing',
    title: 'Data Sharing',
    description: 'I consent to sharing my data with institutional authorities, parents, and service providers as needed.',
  },
  {
    id: 'data_retention',
    title: 'Data Retention',
    description: 'I understand my data will be retained during and after my stay as per institutional policies.',
  },
  {
    id: 'biometric',
    title: 'Future Biometric Data',
    description: 'I consent to the potential future collection of biometric data (fingerprint/face) for attendance and security.',
    required: false,
  },
];

export const ConsentStep: React.FC<ConsentStepProps> = ({
  data,
  onChange,
  errors,
  setErrors,
  isValid,
  setIsValid,
  saving,
}) => {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const handleConsentChange = (consentId: string, value: boolean) => {
    setConsents((prev) => ({ ...prev, [consentId]: value }));
    onChange(`consent_${consentId}`, value);
  };

  const handleAcceptAll = () => {
    const allConsents: Record<string, boolean> = {};
    CONSENT_POINTS.forEach((point) => {
      allConsents[point.id] = true;
    });
    setConsents(allConsents);
    setAgreedToTerms(true);
    setAgreedToPrivacy(true);
    onChange('allConsents', allConsents);
    onChange('agreedToTerms', true);
    onChange('agreedToPrivacy', true);
  };

  const handleDeclineAll = () => {
    const allConsents: Record<string, boolean> = {};
    CONSENT_POINTS.forEach((point) => {
      allConsents[point.id] = point.required ? false : false;
    });
    setConsents(allConsents);
    setAgreedToTerms(false);
    setAgreedToPrivacy(false);
    onChange('allConsents', allConsents);
    onChange('agreedToTerms', false);
    onChange('agreedToPrivacy', false);
  };

  const requiredConsentsGiven = CONSENT_POINTS.filter((p) => p.required !== false).every(
    (point) => consents[point.id]
  );

  useEffect(() => {
    setIsValid(requiredConsentsGiven && agreedToTerms && agreedToPrivacy);
  }, [requiredConsentsGiven, agreedToTerms, agreedToPrivacy, setIsValid]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          DPDP Consent Renewal
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Please review and accept the Data Protection and Privacy Principles consent to complete your renewal.
        </p>
      </div>

      <Card padding="md" shadow="sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText className="w-5 h-5" />
            Consent Details
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDeclineAll}>
              Decline All
            </Button>
            <Button variant="secondary" size="sm" onClick={handleAcceptAll}>
              Accept All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {CONSENT_POINTS.map((point) => (
            <div
              key={point.id}
              className="p-4 rounded-lg border"
              style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-page)' }}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={consents[point.id] || false}
                  onChange={(e) => handleConsentChange(point.id, e.target.checked)}
                  id={`consent_${point.id}`}
                  label=""
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`consent_${point.id}`}
                      className="font-medium cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {point.title}
                    </label>
                    {point.required === false && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {point.description}
                  </p>
                </div>
                {consents[point.id] && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFullPolicy(!showFullPolicy)}
          className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            View Full DPDP Policy
          </span>
          <ExternalLink className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
        {showFullPolicy && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-sans" style={{ color: 'var(--text-primary)' }}>
                {DPDP_CONSENT_TEXT.trim()}
              </pre>
            </div>
          </div>
        )}
      </div>

      <Card padding="md" shadow="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                onChange('agreedToTerms', e.target.checked);
              }}
              id="agreedToTerms"
              label=""
            />
            <label htmlFor="agreedToTerms" className="text-sm cursor-pointer">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                I have read and agree to the Terms and Conditions
              </span>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                I acknowledge that I have read the full DPDP policy and consent to the data
                collection, usage, and sharing practices described above.
              </p>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              checked={agreedToPrivacy}
              onChange={(e) => {
                setAgreedToPrivacy(e.target.checked);
                onChange('agreedToPrivacy', e.target.checked);
              }}
              id="agreedToPrivacy"
              label=""
            />
            <label htmlFor="agreedToPrivacy" className="text-sm cursor-pointer">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                I understand my privacy rights
              </span>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                I understand that I have the right to access, rectify, and request deletion
                of my personal data, and I can withdraw this consent at any time.
              </p>
            </label>
          </div>
        </div>
      </Card>

      {!requiredConsentsGiven && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Required Consents Pending
              </p>
              <p className="text-sm text-red-700">
                Please accept all required consent points to proceed with your renewal.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Consent Recording</p>
            <p className="text-sm text-blue-700">
              Your consent will be digitally recorded with timestamp, IP address, and
              version of the policy you accepted. This record is maintained for
              audit and legal compliance purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentStep;
