'use client';

import React, { useState } from 'react';
import { FileText, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';

interface ConductFormData {
  rating: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT';
  remarks: string;
}

interface CertificateGenerationButtonProps {
  studentName: string;
  exitRequestId: string;
  isApproved: boolean;
  hasExistingCertificate?: boolean;
  existingVersion?: number;
  onGenerate: (conductData?: ConductFormData) => Promise<void>;
  onViewExisting?: () => void;
  className?: string;
}

export const CertificateGenerationButton: React.FC<CertificateGenerationButtonProps> = ({
  studentName,
  exitRequestId,
  isApproved,
  hasExistingCertificate = false,
  existingVersion,
  onGenerate,
  onViewExisting,
  className,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [includeConductStatement, setIncludeConductStatement] = useState(false);
  const [conductData, setConductData] = useState<ConductFormData>({
    rating: 'GOOD',
    remarks: '',
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const dataToSend = includeConductStatement ? conductData : undefined;
      await onGenerate(dataToSend);
      setShowModal(false);
      // Reset form
      setIncludeConductStatement(false);
      setConductData({ rating: 'GOOD', remarks: '' });
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isApproved) {
    return (
      <div className={cn('bg-gray-50 border border-gray-200 rounded-lg p-4', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Certificate Not Available
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Exit certificate can only be generated after final approval.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('bg-white border border-gray-200 rounded-lg p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Exit Certificate
              </h3>
              {hasExistingCertificate ? (
                <p className="text-xs text-gray-600 mt-1">
                  Certificate Version {existingVersion} generated
                </p>
              ) : (
                <p className="text-xs text-gray-600 mt-1">
                  Generate official exit certificate for {studentName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasExistingCertificate && onViewExisting && (
              <Button variant="secondary" size="sm" onClick={onViewExisting}>
                <FileText className="w-4 h-4 mr-2" />
                View Certificate
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              {hasExistingCertificate ? (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Re-generate
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 mr-2" />
                  Generate Certificate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Generation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-green-50">
              <div className="flex items-start gap-3">
                <Award className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-green-900">
                    Generate Exit Certificate
                  </h2>
                  <p className="text-sm text-green-700 mt-1">
                    {studentName} • Exit Request #{exitRequestId}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Certificate Generation Ready</p>
                    <p className="mt-1">
                      This will create an official, versioned PDF certificate
                      capturing all exit details at this point in time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conduct Statement Toggle */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="include-conduct"
                    checked={includeConductStatement}
                    onChange={(e) => setIncludeConductStatement(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="include-conduct"
                    className="flex-1 cursor-pointer"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      Include Conduct Statement (Optional)
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Add a conduct and behavior assessment to the certificate
                    </p>
                  </label>
                </div>

                {includeConductStatement && (
                  <div className="ml-7 space-y-3 mt-4 pl-4 border-l-2 border-green-200">
                    {/* Rating Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conduct Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'EXCELLENT', label: 'Excellent', color: 'green' },
                          { value: 'GOOD', label: 'Good', color: 'blue' },
                          { value: 'SATISFACTORY', label: 'Satisfactory', color: 'yellow' },
                          { value: 'NEEDS_IMPROVEMENT', label: 'Needs Improvement', color: 'orange' },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                              conductData.rating === option.value
                                ? `bg-${option.color}-50 border-${option.color}-300`
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            )}
                          >
                            <input
                              type="radio"
                              name="conduct-rating"
                              value={option.value}
                              checked={conductData.rating === option.value}
                              onChange={(e) =>
                                setConductData({
                                  ...conductData,
                                  rating: e.target.value as ConductFormData['rating'],
                                })
                              }
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarks (Optional)
                      </label>
                      <textarea
                        value={conductData.remarks}
                        onChange={(e) =>
                          setConductData({
                            ...conductData,
                            remarks: e.target.value,
                          })
                        }
                        rows={3}
                        className="input w-full text-sm"
                        placeholder="Add any specific remarks about the student's conduct during their stay..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Certificate content will be locked and immutable once generated</li>
                      <li>All generation events are logged for audit purposes</li>
                      <li>If corrections are needed later, use the re-issue function</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowModal(false);
                  setIncludeConductStatement(false);
                  setConductData({ rating: 'GOOD', remarks: '' });
                }}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                loading={generating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Award className="w-4 h-4 mr-2" />
                Generate Certificate
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

CertificateGenerationButton.displayName = 'CertificateGenerationButton';
