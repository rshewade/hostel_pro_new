// Clearance checklist types
export type ClearanceItemStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'WAIVED';

export type ClearanceItemType =
  | 'ROOM_INVENTORY'
  | 'KEY_RETURN'
  | 'ID_CARD_RETURN'
  | 'ACCOUNTS_CLEARANCE'
  | 'LIBRARY_DUES'
  | 'MESS_DUES'
  | 'CUSTOM';

export type ClearanceOwnerRole =
  | 'SUPERINTENDENT'
  | 'ACCOUNTS'
  | 'LIBRARY'
  | 'MESS'
  | 'ADMIN';

export interface ClearanceItemHistoryEntry {
  id: string;
  previousStatus: ClearanceItemStatus | null;
  newStatus: ClearanceItemStatus;
  remarks?: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  justification?: string; // For reversals from COMPLETED
}

export interface ClearanceItem {
  id: string;
  type: ClearanceItemType;
  title: string;
  description: string;
  ownerRole: ClearanceOwnerRole;
  status: ClearanceItemStatus;
  isMandatory: boolean;
  lastUpdatedAt: string;
  lastUpdatedBy?: string;
  remarks?: string;
  studentInstructions?: string; // Instructions visible to students
  history: ClearanceItemHistoryEntry[];
}

export interface ExitClearanceChecklist {
  exitRequestId: string;
  items: ClearanceItem[];
  allMandatoryCompleted: boolean;
  blockingItems: string[]; // IDs of items blocking approval
}

// Dashboard types
export type ExitProgressState =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE';

export type HostelVertical = 'BOYS' | 'GIRLS' | 'DHARAMSHALA';

export interface ExitRequestSummary {
  id: string;
  studentName: string;
  studentId: string;
  roomNumber: string;
  vertical: HostelVertical;
  requestedExitDate: string;
  submittedDate: string;
  currentStatus: 'SUBMITTED' | 'UNDER_CLEARANCE' | 'APPROVED' | 'REJECTED';
  clearanceProgress: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  ownedItems: {
    total: number;
    completed: number;
    pending: number;
  };
  agingDays: number; // Days since submission
  isHighRisk: boolean; // Overdue or critical issues
  lastActivity?: {
    timestamp: string;
    actor: string;
    action: string;
  };
}

export interface DashboardFilters {
  vertical?: HostelVertical;
  progressState?: ExitProgressState;
  dateRange?: {
    from: string;
    to: string;
  };
  searchQuery?: string;
}

export type SortOption =
  | 'OLDEST_FIRST'
  | 'NEWEST_FIRST'
  | 'EXIT_DATE_ASC'
  | 'EXIT_DATE_DESC'
  | 'HIGH_RISK_FIRST'
  | 'PROGRESS_ASC'
  | 'PROGRESS_DESC';

// Approval types
export interface ApprovalMetadata {
  approverRole: string;
  approverName: string;
  approverId: string;
  timestamp: string;
  remarks?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface FinancialSummary {
  securityDeposit: number;
  pendingDues: number;
  refundAmount: number;
  messDues?: number;
  libraryDues?: number;
  otherCharges?: number;
  isClearanceComplete: boolean;
  clearanceRemarks?: string;
}

export interface ApprovalBlocker {
  id: string;
  type: 'MANDATORY_ITEM' | 'FINANCIAL' | 'SYSTEM';
  severity: 'ERROR' | 'WARNING';
  title: string;
  description: string;
  itemId?: string; // Reference to checklist item if applicable
}

export interface ExitApprovalData {
  exitRequestId: string;
  studentName: string;
  studentId: string;
  roomNumber: string;
  vertical: HostelVertical;
  requestedExitDate: string;
  submittedDate: string;
  currentStatus: 'SUBMITTED' | 'UNDER_CLEARANCE' | 'APPROVED';
  checklist: ExitClearanceChecklist;
  financialSummary: FinancialSummary;
  blockers: ApprovalBlocker[];
  canApprove: boolean;
  approvalHistory?: ApprovalMetadata[];
  lastOverride?: {
    metadata: ApprovalMetadata;
    reason: string;
    referencedApprovalId: string;
  };
}

export interface ApprovalConsequences {
  title: string;
  description: string;
  impacts: string[];
}

export type OverrideReason =
  | 'DATA_ERROR'
  | 'EMERGENCY'
  | 'POLICY_EXCEPTION'
  | 'TECHNICAL_ISSUE'
  | 'OTHER';

// Certificate types
export interface ConductStatement {
  rating: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT';
  remarks?: string;
  issuedBy: string;
  issuedByRole: string;
}

export interface CertificateData {
  certificateId: string;
  version: number;
  studentName: string;
  studentId: string;
  fatherName: string;
  vertical: HostelVertical;
  roomNumber: string;
  admissionDate: string;
  exitDate: string;
  stayDuration: string; // e.g., "18 months"
  conductStatement?: ConductStatement;
  approvalDate: string;
  approvedBy: string;
  approvedByRole: string;
  trusteeSignature?: string; // URL to signature image
  superintendentSignature?: string;
  institutionSeal?: string; // URL to seal image
  generatedAt: string;
  generatedBy: string;
  versionHash: string; // For audit verification
  previousVersionId?: string; // Link to previous version if re-issued
  reissueReason?: string;
}

export interface CertificateVersion {
  versionId: string;
  certificateId: string;
  version: number;
  generatedAt: string;
  generatedBy: string;
  generatedByRole: string;
  reason?: string; // For re-issues
  downloadCount: number;
  printCount: number;
  isCurrent: boolean;
}

export interface CertificateGenerationLog {
  logId: string;
  certificateId: string;
  version: number;
  action: 'GENERATED' | 'DOWNLOADED' | 'PRINTED' | 'VIEWED' | 'REISSUED';
  actor: string;
  actorRole: string;
  timestamp: string;
  deviceInfo?: string;
  ipAddress?: string;
  reason?: string; // For re-issues
}

export interface CertificateViewerProps {
  certificate: CertificateData;
  onDownload?: () => void;
  onPrint?: () => void;
  onReissue?: (reason: string) => void;
  canReissue?: boolean;
  showControls?: boolean;
}

// Alumni types
export type AlumniStatus = 'ALUMNI' | 'ARCHIVED';

export interface ContactUpdateLog {
  logId: string;
  field: string;
  oldValue: string;
  newValue: string;
  updatedBy: string;
  updatedByRole: string;
  timestamp: string;
  reason?: string;
}

export interface StayHistorySummary {
  vertical: HostelVertical;
  admissionDate: string;
  exitDate: string;
  totalDuration: string; // e.g., "18 months"
  roomAllocations: Array<{
    roomNumber: string;
    fromDate: string;
    toDate: string;
  }>;
  renewalCount: number;
}

export interface AlumniContactInfo {
  email: string;
  phone: string;
  alternatePhone?: string;
  permanentAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  lastUpdated: string;
  updateHistory: ContactUpdateLog[];
}

export interface AlumniFinancialSummary {
  totalFeePaid: number;
  securityDepositPaid: number;
  securityDepositRefunded: number;
  finalDuesSettled: boolean;
  settlementDate: string;
  outstandingAmount: number;
}

export interface AlumniData {
  alumniId: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  dateOfBirth: string;
  status: AlumniStatus;
  transitionDate: string; // Date when moved to alumni status
  transitionTriggeredBy: string;
  stayHistory: StayHistorySummary;
  contactInfo: AlumniContactInfo;
  financialSummary: AlumniFinancialSummary;
  exitCertificateId?: string;
  communicationHistoryLink: string;
  financialRecordsLink: string;
  profilePhotoUrl?: string;
  dataRetentionUntil: string; // Date when data will be archived/deleted per DPDP
  canBeDeleted: boolean; // Based on retention policy
}

export interface AlumniTransitionData {
  fromStatus: string;
  toStatus: 'ALUMNI';
  studentId: string;
  studentName: string;
  exitRequestId: string;
  triggeredBy: string;
  triggeredByRole: string;
  timestamp: string;
  reason: string;
  isReversible: boolean; // Always false for alumni transition
}

export interface AlumniFilters {
  searchQuery?: string;
  vertical?: HostelVertical | 'ALL';
  exitYearFrom?: number;
  exitYearTo?: number;
  status?: AlumniStatus | 'ALL';
  hasOutstandingDues?: boolean;
}

export interface AlumniSearchResult {
  alumniId: string;
  studentName: string;
  studentId: string;
  vertical: HostelVertical;
  exitDate: string;
  status: AlumniStatus;
  hasOutstandingDues: boolean;
}
