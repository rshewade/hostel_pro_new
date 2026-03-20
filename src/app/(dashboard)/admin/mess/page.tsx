import { FutureModulePage } from '@/components/future/ComingSoonPlaceholder';

const messIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const plannedFeatures = [
  'Centralized mess menu planning and scheduling',
  'Food inventory and supplier management',
  'Mess attendance tracking and billing reconciliation',
  'Special diet management (Jain, medical requirements)',
  'Food quality monitoring and feedback analysis',
  'Mess revenue and expense reporting',
];

export default function AdminMessPage() {
  return (
    <FutureModulePage
      title="Mess Management Admin"
      description="Configure mess operations, menus, and billing"
      fullDescription="This admin module will provide comprehensive mess management capabilities including menu planning, inventory tracking, attendance-based billing, special diet management, and detailed analytics on food costs and student satisfaction."
      icon={messIcon}
      featureFlag="FEAT_MESS_MANAGEMENT"
      estimatedLaunch="Q1 2026"
      plannedFeatures={plannedFeatures}
    />
  );
}
