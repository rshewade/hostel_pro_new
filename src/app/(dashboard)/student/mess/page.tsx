import { FutureModulePage } from '@/components/future/ComingSoonPlaceholder';

const messIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const plannedFeatures = [
  'Daily mess menu display with nutritional information',
  'Mess attendance tracking and billing',
  'Special meal requests ( Jain food, fasting days, etc.)',
  'Mess fee payment and refund management',
  'Feedback and rating system for food quality',
  'Weekly/monthly consumption reports',
];

export default function StudentMessPage() {
  return (
    <FutureModulePage
      title="Mess Management"
      description="View mess menus, track attendance, and manage food preferences"
      fullDescription="This module will help you stay informed about the daily mess menu, track your mess attendance, and manage special food requirements. You can also provide feedback on food quality and view your mess billing details."
      icon={messIcon}
      featureFlag="FEAT_MESS_MANAGEMENT"
      estimatedLaunch="Q1 2026"
      plannedFeatures={plannedFeatures}
    />
  );
}
