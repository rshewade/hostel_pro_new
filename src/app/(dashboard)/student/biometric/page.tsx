import { FutureModulePage, ComingSoonPlaceholder } from '@/components/future/ComingSoonPlaceholder';

const biometricIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const plannedFeatures = [
  'Real-time attendance tracking via fingerprint or facial recognition',
  'Automated attendance reports and analytics',
  'Integration with leave management system',
  'Secure biometric data storage with DPDP compliance',
  'Parent notification on arrival/departure',
  'Missing attendance alerts and reminders',
];

export default function StudentBiometricPage() {
  return (
    <FutureModulePage
      title="Biometric Attendance"
      description="Track your attendance using fingerprint or facial recognition"
      fullDescription="This module will enable you to mark your daily attendance using secure biometric verification. Simply scan your fingerprint or use facial recognition at the designated terminals when entering and exiting the hostel premises."
      icon={biometricIcon}
      featureFlag="FEAT_BIOMETRIC_ATTENDANCE"
      estimatedLaunch="Q2 2026"
      plannedFeatures={plannedFeatures}
    />
  );
}
