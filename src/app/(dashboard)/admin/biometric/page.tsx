import { FutureModulePage } from '@/components/future/ComingSoonPlaceholder';

const biometricIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const plannedFeatures = [
  'Configure and manage biometric devices across all hostels',
  'Real-time attendance monitoring dashboard',
  'Automated alerts for irregular attendance patterns',
  'Generate compliance reports for management',
  'Manage student biometric enrollment and updates',
  'Integration with existing CCTV and security systems',
];

export default function AdminBiometricPage() {
  return (
    <FutureModulePage
      title="Biometric Attendance Management"
      description="Configure devices and monitor attendance across hostels"
      fullDescription="This admin module will enable you to manage biometric attendance terminals across all hostel locations, monitor real-time attendance data, configure automated alerts for irregular patterns, and generate comprehensive reports for management review."
      icon={biometricIcon}
      featureFlag="FEAT_BIOMETRIC_ATTENDANCE"
      estimatedLaunch="Q2 2026"
      plannedFeatures={plannedFeatures}
    />
  );
}
