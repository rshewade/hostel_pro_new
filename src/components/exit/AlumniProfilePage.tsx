'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  Calendar,
  Award,
  IndianRupee,
  MessageSquare,
  FileText,
  Download,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { AlumniStatusBadge } from './AlumniStatusBadge';
import { AlumniStayHistory } from './AlumniStayHistory';
import { AlumniContactEditor } from './AlumniContactEditor';
import type { AlumniData, AlumniContactInfo } from './types';

interface AlumniProfilePageProps {
  alumniData: AlumniData;
  canEditContact?: boolean;
  canDownloadCertificate?: boolean;
  onContactUpdate?: (updatedInfo: Partial<AlumniContactInfo>, reason: string) => Promise<void>;
  onDownloadCertificate?: () => void;
  className?: string;
}

export const AlumniProfilePage: React.FC<AlumniProfilePageProps> = ({
  alumniData,
  canEditContact = false,
  canDownloadCertificate = true,
  onContactUpdate,
  onDownloadCertificate,
  className,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const daysUntilRetention = Math.ceil(
    (new Date(alumniData.dataRetentionUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card - Identity & Status */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg overflow-hidden">
        <div className="p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* Profile Photo */}
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white">
                {alumniData.profilePhotoUrl ? (
                  <Image
                    src={alumniData.profilePhotoUrl}
                    alt={alumniData.studentName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                    <User className="w-12 h-12 text-purple-600" />
                  </div>
                )}
              </div>

              {/* Name & Basic Info */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{alumniData.studentName}</h1>
                <div className="flex items-center gap-3 text-purple-100">
                  <span className="text-sm">Student ID: {alumniData.studentId}</span>
                  <span>•</span>
                  <span className="text-sm">Alumni ID: {alumniData.alumniId}</span>
                </div>
                <div className="mt-3">
                  <AlumniStatusBadge status={alumniData.status} size="md" />
                </div>
              </div>
            </div>

            {/* Read-Only Notice */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4" />
                <span>Read-Only Profile</span>
              </div>
              <p className="text-xs text-purple-100 mt-1">
                Alumni records are archived
              </p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-purple-100 text-xs mb-1">Father's Name</div>
              <div className="text-white font-semibold">{alumniData.fatherName}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-purple-100 text-xs mb-1">Date of Birth</div>
              <div className="text-white font-semibold">{formatDate(alumniData.dateOfBirth)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-purple-100 text-xs mb-1">Transitioned to Alumni</div>
              <div className="text-white font-semibold">{formatDate(alumniData.transitionDate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Irreversible Status Notice */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-orange-900">
              Irreversible Alumni Status
            </h3>
            <p className="text-sm text-orange-800 mt-1">
              This user has transitioned to Alumni status and cannot be reverted to active resident
              through normal workflows. Any return to resident status must follow a complete
              re-admission process.
            </p>
            <p className="text-xs text-orange-700 mt-2">
              Transitioned by: <strong>{alumniData.transitionTriggeredBy}</strong> on{' '}
              {formatDate(alumniData.transitionDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Exit Certificate */}
        {alumniData.exitCertificateId && (
          <button
            onClick={onDownloadCertificate}
            disabled={!canDownloadCertificate}
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Exit Certificate</div>
              <div className="text-xs text-gray-600">Download PDF</div>
            </div>
          </button>
        )}

        {/* Communication History */}
        <Link
          href={alumniData.communicationHistoryLink}
          className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Communications</div>
            <div className="text-xs text-gray-600">View history</div>
          </div>
        </Link>

        {/* Financial Records */}
        <Link
          href={alumniData.financialRecordsLink}
          className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Financial Records</div>
            <div className="text-xs text-gray-600">View transactions</div>
          </div>
        </Link>

        {/* Data Retention Info */}
        <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-yellow-50">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Data Retention</div>
            <div className="text-xs text-yellow-700">{daysUntilRetention} days left</div>
          </div>
        </div>
      </div>

      {/* Stay History */}
      <AlumniStayHistory stayHistory={alumniData.stayHistory} />

      {/* Financial Summary */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
          <p className="text-sm text-gray-600 mt-1">
            Settlement Date: {formatDate(alumniData.financialSummary.settlementDate)}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-xs text-blue-700 mb-1">Total Fees Paid</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(alumniData.financialSummary.totalFeePaid)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-xs text-green-700 mb-1">Security Deposit Refunded</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(alumniData.financialSummary.securityDepositRefunded)}
              </div>
            </div>
            <div
              className={cn(
                'p-4 rounded-lg border',
                alumniData.financialSummary.outstandingAmount > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              <div
                className={cn(
                  'text-xs mb-1',
                  alumniData.financialSummary.outstandingAmount > 0
                    ? 'text-red-700'
                    : 'text-gray-700'
                )}
              >
                Outstanding Amount
              </div>
              <div
                className={cn(
                  'text-2xl font-bold',
                  alumniData.financialSummary.outstandingAmount > 0
                    ? 'text-red-900'
                    : 'text-gray-900'
                )}
              >
                {formatCurrency(alumniData.financialSummary.outstandingAmount)}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {alumniData.financialSummary.finalDuesSettled ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-700 font-medium">
                    All dues settled
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm text-red-700 font-medium">
                    Outstanding dues pending
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information (Editable) */}
      <AlumniContactEditor
        contactInfo={alumniData.contactInfo}
        canEdit={canEditContact}
        onSave={onContactUpdate || (async () => {})}
      />

      {/* Data Retention Notice */}
      {daysUntilRetention < 90 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900">
                Data Retention Policy Notice
              </h3>
              <p className="text-sm text-yellow-800 mt-1">
                This alumni record will be archived on{' '}
                <strong>{formatDate(alumniData.dataRetentionUntil)}</strong> ({daysUntilRetention}{' '}
                days from now) per DPDP Act compliance. After archival, only minimal identity
                records will be retained.
              </p>
              {alumniData.canBeDeleted && (
                <p className="text-sm text-yellow-800 mt-2">
                  You may request early deletion of this record if required.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AlumniProfilePage.displayName = 'AlumniProfilePage';
