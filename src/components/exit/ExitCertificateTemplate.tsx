'use client';

import React from 'react';
import Image from 'next/image';
import { Award, Calendar, Home, User, Shield } from 'lucide-react';
import { cn } from '../utils';
import type { CertificateData } from './types';

interface ExitCertificateTemplateProps {
  certificate: CertificateData;
  className?: string;
}

export const ExitCertificateTemplate: React.FC<ExitCertificateTemplateProps> = ({
  certificate,
  className,
}) => {
  const {
    certificateId,
    version,
    studentName,
    studentId,
    fatherName,
    vertical,
    roomNumber,
    admissionDate,
    exitDate,
    stayDuration,
    conductStatement,
    approvalDate,
    approvedBy,
    approvedByRole,
    generatedAt,
    versionHash,
    reissueReason,
  } = certificate;

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'certificate-template bg-white',
        'print:shadow-none',
        className
      )}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 15mm',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Ornamental Border */}
      <div
        className="certificate-border"
        style={{
          border: '3px double #1e40af',
          padding: '15mm 12mm',
          minHeight: 'calc(297mm - 40mm)',
          position: 'relative',
        }}
      >
        {/* Inner decorative border */}
        <div
          style={{
            border: '1px solid #d4af37',
            padding: '10mm',
            minHeight: 'calc(297mm - 70mm)',
          }}
        >
          {/* Header */}
          <div className="certificate-header text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="Institution Logo"
                width={80}
                height={80}
                className="print:w-20 print:h-20"
              />
            </div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: '#1e40af', fontFamily: 'Georgia, serif' }}
            >
              Jain Hostel & Ashram
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              [Institution Address]
            </p>
            <p className="text-sm text-gray-600">
              [City, State, PIN Code]
            </p>

            <div className="mt-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-6 h-6 text-yellow-600" />
                <h2
                  className="text-2xl font-semibold"
                  style={{ color: '#d4af37', fontFamily: 'Georgia, serif' }}
                >
                  EXIT CERTIFICATE
                </h2>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-2/3 mx-auto"></div>
            </div>
          </div>

          {/* Certificate Number and Version */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Certificate No:{' '}
              <strong className="text-gray-900">{certificateId}</strong>
              {version > 1 && (
                <span className="ml-2 text-xs text-orange-600">
                  (Version {version})
                </span>
              )}
            </p>
          </div>

          {/* Main Content */}
          <div className="certificate-body space-y-6" style={{ fontSize: '14px', lineHeight: '1.8' }}>
            {/* Introduction */}
            <p className="text-center text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
              This is to certify that
            </p>

            {/* Student Details */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600">Student Name</div>
                    <div className="font-bold text-gray-900 text-lg">{studentName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600">Student ID</div>
                    <div className="font-semibold text-gray-900">{studentId}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-start gap-2">
                  <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600">Father's Name</div>
                    <div className="font-semibold text-gray-900">{fatherName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Home className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600">Vertical</div>
                    <div className="font-semibold text-gray-900">{vertical}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Home className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-600">Room Number</div>
                    <div className="font-semibold text-gray-900">{roomNumber}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Period */}
            <p className="text-center text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
              was a resident of our {vertical} from{' '}
              <strong className="text-gray-900">{formatDate(admissionDate)}</strong> to{' '}
              <strong className="text-gray-900">{formatDate(exitDate)}</strong>,{' '}
              a period of <strong className="text-gray-900">{stayDuration}</strong>.
            </p>

            {/* Conduct Statement */}
            {conductStatement && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Conduct & Behavior
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-700">Rating:</span>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold',
                        conductStatement.rating === 'EXCELLENT' && 'bg-green-600 text-white',
                        conductStatement.rating === 'GOOD' && 'bg-green-500 text-white',
                        conductStatement.rating === 'SATISFACTORY' && 'bg-yellow-500 text-white',
                        conductStatement.rating === 'NEEDS_IMPROVEMENT' && 'bg-orange-500 text-white'
                      )}
                    >
                      {conductStatement.rating}
                    </span>
                  </div>
                  {conductStatement.remarks && (
                    <p className="text-sm text-green-800 italic">
                      "{conductStatement.remarks}"
                    </p>
                  )}
                  <p className="text-xs text-green-700">
                    — {conductStatement.issuedBy}, {conductStatement.issuedByRole}
                  </p>
                </div>
              </div>
            )}

            {/* Clearance Statement */}
            <p className="text-center text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
              All clearance formalities including room inventory, library, mess dues,
              and financial obligations have been completed satisfactorily.
            </p>

            {/* Approval Statement */}
            <p className="text-center text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
              This exit request was approved on{' '}
              <strong className="text-gray-900">{formatDate(approvalDate)}</strong> by{' '}
              <strong className="text-gray-900">{approvedBy}</strong> ({approvedByRole}).
            </p>

            {/* Re-issue Notice */}
            {reissueReason && version > 1 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 text-sm">
                <p className="font-semibold text-orange-900 mb-1">
                  Certificate Re-issued
                </p>
                <p className="text-orange-800 text-xs">
                  Reason: {reissueReason}
                </p>
              </div>
            )}

            {/* Closing Statement */}
            <p className="text-center text-gray-700 mt-8" style={{ fontFamily: 'Georgia, serif' }}>
              We wish {studentName.split(' ')[0]} all success in future endeavors.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-16 mb-8">
            <div className="text-center">
              <div className="h-16 border-b-2 border-gray-300 mb-2"></div>
              <p className="font-semibold text-gray-900">Superintendent</p>
              <p className="text-xs text-gray-600">{vertical}</p>
              <p className="text-xs text-gray-600 mt-1">Date: {formatDate(generatedAt)}</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b-2 border-gray-300 mb-2"></div>
              <p className="font-semibold text-gray-900">Trustee/Authorized Signatory</p>
              <p className="text-xs text-gray-600">Jain Hostel & Ashram</p>
              <p className="text-xs text-gray-600 mt-1">Date: {formatDate(generatedAt)}</p>
            </div>
          </div>

          {/* Seal Placeholder */}
          <div className="text-center mb-4">
            <div className="inline-block w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-400">Official Seal</span>
            </div>
          </div>

          {/* Footer - Version Info */}
          <div className="border-t border-gray-200 pt-4 mt-8">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div>
                <p>Certificate ID: {certificateId}</p>
                <p>Generated: {new Date(generatedAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p>Version: {version}</p>
                <p className="font-mono text-xs">Hash: {versionHash.substring(0, 16)}...</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              This is a system-generated certificate. Any alterations will invalidate this document.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .certificate-template {
            margin: 0;
            box-shadow: none;
            page-break-after: always;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

ExitCertificateTemplate.displayName = 'ExitCertificateTemplate';
