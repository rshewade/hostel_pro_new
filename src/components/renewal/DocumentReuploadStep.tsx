'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileUpload } from '@/components/forms/FileUpload';
import { FormFieldWrapper } from '@/components/forms/InlineHelp';
import { CheckCircle, Circle, Upload, FileText, AlertCircle, InfoIcon, X } from 'lucide-react';
import {
  WizardFormData,
} from '@/components/forms/FormWizard';

interface DocumentReuploadStepProps {
  data: WizardFormData;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
  saving?: boolean;
}

interface RequiredDocument {
  id: string;
  type: 'marksheet_latest' | 'id_proof' | 'address_proof' | 'photo';
  name: string;
  description: string;
  required: boolean;
}

const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  {
    id: 'marksheet',
    type: 'marksheet_latest',
    name: 'Latest Marksheet',
    description: 'Upload your most recent semester/year marksheet (PDF or Image)',
    required: true,
  },
  {
    id: 'id_proof',
    type: 'id_proof',
    name: 'ID Proof',
    description: 'Government-issued ID (Aadhar Card, PAN Card, or Passport)',
    required: true,
  },
  {
    id: 'address_proof',
    type: 'address_proof',
    name: 'Address Proof',
    description: 'Recent utility bill, rental agreement, or bank statement (not older than 3 months)',
    required: false,
  },
  {
    id: 'photo',
    type: 'photo',
    name: 'Passport Photo',
    description: 'Recent passport-size photograph with white background',
    required: false,
  },
];

interface UploadedDocument {
  type: string;
  fileName: string;
  uploadedAt: string;
  status: 'UPLOADED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export const DocumentReuploadStep: React.FC<DocumentReuploadStepProps> = ({
  data,
  onChange,
  errors,
  setErrors,
  isValid,
  setIsValid,
  saving,
}) => {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (docType: string, file: File | null) => {
      if (file) {
        const newDoc: UploadedDocument = {
          type: docType,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          status: 'UPLOADED',
        };

        setUploadedDocs((prev) => {
          const existing = prev.findIndex((d) => d.type === docType);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newDoc;
            return updated;
          }
          return [...prev, newDoc];
        });

        onChange(`doc_${docType}`, newDoc);
        setUploadError(null);
      }
    },
    [onChange]
  );

  const handleRemoveDocument = useCallback(
    (docType: string) => {
      setUploadedDocs((prev) => prev.filter((d) => d.type !== docType));
      onChange(`doc_${docType}`, null);
    },
    [onChange]
  );

  const isDocumentUploaded = (docType: string) => {
    return uploadedDocs.some((d) => d.type === docType);
  };

  const getDocumentStatus = (docType: string) => {
    const doc = uploadedDocs.find((d) => d.type === docType);
    if (!doc) return 'pending';
    return doc.status;
  };

  const getProgress = () => {
    const required = REQUIRED_DOCUMENTS.filter((d) => d.required);
    const uploaded = required.filter((d) => isDocumentUploaded(d.type));
    return Math.round((uploaded.length / required.length) * 100);
  };

  const progress = getProgress();
  const allRequiredUploaded = REQUIRED_DOCUMENTS.filter((d) => d.required).every((d) => isDocumentUploaded(d.type));

  React.useEffect(() => {
    setIsValid(allRequiredUploaded);
  }, [allRequiredUploaded, setIsValid]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Document Re-upload
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Please upload updated documents for your renewal. Required documents must be uploaded to proceed.
        </p>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Document Upload Progress
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {REQUIRED_DOCUMENTS.filter((d) => d.required).filter((d) => isDocumentUploaded(d.type)).length}/
            {REQUIRED_DOCUMENTS.filter((d) => d.required).length} Required
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: allRequiredUploaded ? 'var(--color-green-500)' : 'var(--color-blue-500)',
            }}
          />
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const isUploaded = isDocumentUploaded(doc.type);
          const status = getDocumentStatus(doc.type);
          const uploadedDoc = uploadedDocs.find((d) => d.type === doc.type);

          return (
            <Card key={doc.id} padding="md" shadow="sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isUploaded ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    {isUploaded ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {doc.name}
                      </h4>
                      {doc.required && (
                        <Badge variant="error" size="sm">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {doc.description}
                    </p>
                  </div>
                </div>
                {isUploaded && (
                  <Badge
                    variant={status === 'VERIFIED' ? 'success' : status === 'REJECTED' ? 'error' : 'warning'}
                    size="sm"
                  >
                    {status === 'VERIFIED' ? 'Verified' : status === 'REJECTED' ? 'Rejected' : 'Uploaded'}
                  </Badge>
                )}
              </div>

              {isUploaded && uploadedDoc ? (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {uploadedDoc.fileName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Uploaded on {new Date(uploadedDoc.uploadedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDocument(doc.type)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <FileUpload
                  label=""
                  accept=".jpg,.jpeg,.pdf"
                  maxSize={5 * 1024 * 1024}
                  onChange={(file) => handleFileChange(doc.type, file)}
                  onValidationError={(error) => setUploadError(error)}
                  helperText={`Accepted formats: JPG, JPEG, PDF. Maximum size: 5MB`}
                />
              )}
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Document Guidelines</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure all documents are clearly legible and not blurred</li>
              <li>• File names should not contain special characters</li>
              <li>• Upload the most recent versions of required documents</li>
              <li>• If a document is rejected, you will need to re-upload</li>
            </ul>
          </div>
        </div>
      </div>

      {!allRequiredUploaded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Required Documents Pending
              </p>
              <p className="text-sm text-amber-700">
                Please upload all required documents marked with "Required" badge to proceed
                to the next step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentReuploadStep;
