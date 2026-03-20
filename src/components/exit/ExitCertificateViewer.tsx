'use client';

import React, { useState, useRef } from 'react';
import { Download, Printer, RefreshCcw, Eye, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '../utils';
import { Button } from '../ui/Button';
import { ExitCertificateTemplate } from './ExitCertificateTemplate';
import type { CertificateViewerProps } from './types';

export const ExitCertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate,
  onDownload,
  onPrint,
  onReissue,
  canReissue = false,
  showControls = true,
}) => {
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [reissueReason, setReissueReason] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // In a real implementation, this would call an API to generate PDF
      // For now, we'll trigger the onDownload callback
      if (onDownload) {
        await onDownload();
      } else {
        // Fallback: trigger browser print to PDF
        window.print();
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      if (onPrint) {
        await onPrint();
      }
      // Trigger browser print dialog
      window.print();
    } catch (error) {
      console.error('Error printing certificate:', error);
      alert('Failed to print certificate. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  const handleReissueSubmit = async () => {
    if (!reissueReason.trim() || !onReissue) return;

    try {
      await onReissue(reissueReason);
      setShowReissueModal(false);
      setReissueReason('');
    } catch (error) {
      console.error('Error reissuing certificate:', error);
      alert('Failed to reissue certificate. Please try again.');
    }
  };

  return (
    <div className="certificate-viewer">
      {/* Controls */}
      {showControls && (
        <div className="bg-white border-b border-gray-200 p-4 print:hidden sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Exit Certificate - {certificate.studentName}
                </h3>
                <p className="text-sm text-gray-600">
                  Version {certificate.version} • Generated{' '}
                  {new Date(certificate.generatedAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                loading={downloading}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                loading={printing}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>

              {canReissue && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReissueModal(true)}
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Re-issue
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview */}
      <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white">
        <div ref={certificateRef} className="print:shadow-none">
          <ExitCertificateTemplate certificate={certificate} />
        </div>
      </div>

      {/* Re-issue Modal */}
      {showReissueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Re-issue Certificate
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Re-issuing will create a new version of this certificate. The
                  previous version will remain in the audit history.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Re-issue <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reissueReason}
                onChange={(e) => setReissueReason(e.target.value)}
                rows={4}
                className="input w-full"
                placeholder="Explain why this certificate needs to be re-issued (e.g., correction in student name, updated conduct statement, etc.)"
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be recorded in the audit log and displayed on
                the new certificate.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The current certificate (Version{' '}
                {certificate.version}) will be marked as superseded but will
                remain accessible in the version history.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowReissueModal(false);
                  setReissueReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReissueSubmit}
                disabled={!reissueReason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Confirm Re-issue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .print\\:hidden {
            display: none !important;
          }

          .certificate-viewer {
            background: white;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

ExitCertificateViewer.displayName = 'ExitCertificateViewer';
