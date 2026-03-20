'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components';
import { RenewalCard } from '@/components/renewal/RenewalCard';
import { RenewalStatusTracker, RenewalStatus } from '@/components/renewal/RenewalStatusTracker';
import { InfoReviewStep } from '@/components/renewal/InfoReviewStep';
import { DocumentReuploadStep } from '@/components/renewal/DocumentReuploadStep';
import { FeeTopupStep } from '@/components/renewal/FeeTopupStep';
import { ConsentStep } from '@/components/renewal/ConsentStep';
import { RenewalBanner } from '@/components/renewal/RenewalBanner';
import { FormWizard } from '@/components/forms/FormWizard';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, IndianRupee, Shield } from 'lucide-react';

const STEPS = [
  {
    id: 'review',
    title: 'Review Info',
    description: 'Verify your personal and academic details',
    icon: <CheckCircle className="w-5 h-5" />,
    component: InfoReviewStep,
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload required documents',
    icon: <FileText className="w-5 h-5" />,
    component: DocumentReuploadStep,
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Complete fee top-up',
    icon: <IndianRupee className="w-5 h-5" />,
    component: FeeTopupStep,
  },
  {
    id: 'consent',
    title: 'Consent',
    description: 'DPDP consent renewal',
    icon: <Shield className="w-5 h-5" />,
    component: ConsentStep,
  },
];

export default function StudentRenewalPage() {
  const [currentStatus, setCurrentStatus] = useState<RenewalStatus>('IN_PROGRESS');
  const [renewalCompleted, setRenewalCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (data: any) => {
    console.log('Renewal submitted:', data);
    setRenewalCompleted(true);
    setCurrentStatus('SUBMITTED');
  };

  if (renewalCompleted) {
    return (
      <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
        <main className="px-6 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  6-Month Stay Renewal
                </h1>
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}>
                  Boys Hostel
                </span>
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Renewal Submitted Successfully!
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Your renewal application has been submitted and is now under review.
              </p>
            </div>

            <RenewalBanner
              type="success"
              title="Application Received"
              message="Your renewal application has been submitted successfully. The administration will review your application and documents. You will be notified once a decision is made."
              daysRemaining={15}
              className="mb-6"
            />

            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                What's Next?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Application Under Review</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Your application is being reviewed by the superintendent
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Decision Notification</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      You will receive an SMS/WhatsApp notification once a decision is made
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>View Status Online</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Track your application status anytime on this page
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <RenewalStatusTracker
              currentStatus="SUBMITTED"
              showLabels={true}
              size="md"
              className="mb-6"
            />

            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => window.location.href = '/dashboard/student'}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      <main className="px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                6-Month Stay Renewal
              </h1>
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}>
                Boys Hostel | 2025-26 | SEMESTER 1
              </span>
            </div>
          </div>

          {currentStep === 0 && (
            <div className="mb-6">
              <RenewalCard
                studentId="STU001"
                studentName="Amit Kumar Jain"
                vertical="Boys Hostel"
                renewalStatus={currentStatus}
                daysRemaining={30}
                academicYear="2025-26"
                period="SEMESTER 1"
                onContinueRenewal={() => {}}
              />
            </div>
          )}

          <div className="mb-6">
            <RenewalStatusTracker
              currentStatus={currentStatus}
              showLabels={true}
              size="md"
            />
          </div>

          <FormWizard
            steps={STEPS}
            onSubmit={handleSubmit}
            onSubmitLabel="Submit Renewal"
            orientation="horizontal"
          />
        </div>
      </main>
    </div>
  );
}
