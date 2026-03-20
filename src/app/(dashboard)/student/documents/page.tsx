'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components';
import { Card } from '@/components/data/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Download, Eye, Upload, AlertCircle, X } from 'lucide-react';

type DocumentCategory = 'IDENTITY' | 'ADMISSION' | 'UNDERTAKING' | 'RECEIPT';

interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  uploadDate: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'UPLOADED';
  size: string;
  type: string;
  url?: string;
}

const DOCUMENT_TYPES = [
  { value: 'AADHAR_CARD', label: 'Aadhar Card', category: 'IDENTITY' },
  { value: 'PHOTO', label: 'Passport Size Photo', category: 'IDENTITY' },
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', category: 'IDENTITY' },
  { value: 'MARKSHEET', label: 'Academic Marksheet', category: 'ADMISSION' },
  { value: 'TRANSFER_CERTIFICATE', label: 'Transfer Certificate', category: 'ADMISSION' },
  { value: 'INCOME_CERTIFICATE', label: 'Income Certificate', category: 'ADMISSION' },
  { value: 'ANTI_RAGGING', label: 'Anti-Ragging Undertaking', category: 'UNDERTAKING' },
  { value: 'HOSTEL_RULES', label: 'Hostel Rules Acceptance', category: 'UNDERTAKING' },
  { value: 'OTHER', label: 'Other Document', category: 'ADMISSION' },
];

export default function StudentDocumentsPage() {
  const [activeTab, setActiveTab] = useState<DocumentCategory | 'ALL'>('ALL');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get student ID from localStorage on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (userId) {
      setStudentId(userId);
    } else if (token) {
      try {
        if (token.includes('.')) {
          const payload = token.split('.')[1];
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const tokenData = JSON.parse(atob(base64));
          setStudentId(tokenData.sub);
        } else {
          const tokenData = JSON.parse(atob(token));
          setStudentId(tokenData.userId);
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  }, []);

  // Fetch documents when studentId is available
  useEffect(() => {
    if (studentId) {
      fetchDocuments();
    }
  }, [studentId]);

  const fetchDocuments = async () => {
    if (!studentId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/student/documents?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both array and wrapped response
        const docs = Array.isArray(data) ? data : (data.data || []);
        setDocuments(docs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only PDF, JPG, and PNG files are allowed');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType || !studentId) {
      setUploadError('Please select a file and document type');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('student_id', studentId);
      formData.append('document_type', selectedDocType);

      const docTypeInfo = DOCUMENT_TYPES.find(d => d.value === selectedDocType);
      formData.append('category', docTypeInfo?.category || 'ADMISSION');

      const response = await fetch('/api/student/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Close modal and refresh documents
        setShowUploadModal(false);
        setSelectedFile(null);
        setSelectedDocType('');
        fetchDocuments();
        alert('Document uploaded successfully!');
      } else {
        setUploadError(result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setSelectedFile(null);
    setSelectedDocType('');
    setUploadError(null);
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/student/documents/${doc.id}/url`);
      const result = await response.json();

      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        alert(result.error || 'Failed to get document URL');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document');
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      // First get the signed URL
      const urlResponse = await fetch(`/api/student/documents/${doc.id}/url`);
      const urlResult = await urlResponse.json();

      if (!urlResult.success || !urlResult.url) {
        alert(urlResult.error || 'Failed to get document URL');
        return;
      }

      // Fetch the file and download it
      const response = await fetch(urlResult.url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = urlResult.fileName || `${doc.title}.${doc.type.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document');
    }
  };

  const filteredDocuments = activeTab === 'ALL'
    ? documents
    : documents.filter(doc => doc.category === activeTab);

  const getCategoryLabel = (cat: DocumentCategory) => {
    switch (cat) {
      case 'IDENTITY': return 'Identity Proofs';
      case 'ADMISSION': return 'Admission Docs';
      case 'UNDERTAKING': return 'Undertakings';
      case 'RECEIPT': return 'Fee Receipts';
      default: return cat;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'PENDING':
      case 'UPLOADED': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600">View and manage your official hostel documents</p>
          </div>
          <Button variant="primary" size="md" onClick={openUploadModal}>
            <Upload className="w-4 h-4 mr-2" />
            Upload New Document
          </Button>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {['ALL', 'ADMISSION', 'IDENTITY', 'UNDERTAKING', 'RECEIPT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab === 'ALL' ? 'All Documents' : getCategoryLabel(tab as DocumentCategory)}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'ALL'
                ? "You haven't uploaded any documents yet."
                : `No ${getCategoryLabel(activeTab as DocumentCategory).toLowerCase()} found.`}
            </p>
            <Button variant="primary" size="sm" onClick={openUploadModal}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{doc.title}</h3>
                        <p className="text-xs text-gray-500">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(doc.status)} size="sm">
                      {doc.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Uploaded: {new Date(doc.uploadDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Missing Documents Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Missing Required Documents</h4>
            <p className="text-sm text-yellow-800 mt-1">
              Please upload your updated <strong>Income Certificate</strong> before the next renewal cycle (July 2025).
            </p>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {uploadError}
              </div>
            )}

            <div className="space-y-4">
              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select document type</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                >
                  {selectedFile ? (
                    <div>
                      <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to select a file</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || !selectedDocType || uploading}
                className="flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
