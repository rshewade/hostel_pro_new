import { FutureModulePage } from '@/components/future/ComingSoonPlaceholder';

const visitorIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const plannedFeatures = [
  'Pre-register visitors and generate QR codes for check-in',
  'Real-time visitor tracking within premises',
  'Automated entry/exit notifications to students',
  'Secure visitor log with ID verification',
  'Blacklist management for restricted individuals',
  'Generate visitor reports for security audits',
];

export default function StudentVisitorPage() {
  return (
    <FutureModulePage
      title="Visitor Management"
      description="Pre-register visitors and manage gate passes"
      fullDescription="This module will allow you to pre-register your expected visitors, generate gate passes, and receive notifications when visitors arrive. You can also view the complete visitor history for your room."
      icon={visitorIcon}
      featureFlag="FEAT_VISITOR_MANAGEMENT"
      estimatedLaunch="Q3 2026"
      plannedFeatures={plannedFeatures}
    />
  );
}
