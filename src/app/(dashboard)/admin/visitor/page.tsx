import { FutureModulePage } from '@/components/future/ComingSoonPlaceholder';

const visitorIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const plannedFeatures = [
  'Centralized visitor registration and approval workflow',
  'Real-time visitor tracking dashboard',
  'Gate pass generation and validation system',
  'Blacklist management and access control',
  'Visitor analytics and heat map reports',
  'Emergency lockdown capability',
];

export default function AdminVisitorPage() {
  return (
    <FutureModulePage
      title="Visitor Management System"
      description="Manage visitor registration, approvals, and security"
      fullDescription="This module will provide comprehensive visitor management capabilities including pre-registration workflows, real-time tracking dashboards, gate pass validation, and security features like blacklist management and emergency lockdown capabilities."
      icon={visitorIcon}
      featureFlag="FEAT_VISITOR_MANAGEMENT"
      estimatedLaunch="Q3 2026"
      plannedFeatures={plannedFeatures}
    />
  );
}
