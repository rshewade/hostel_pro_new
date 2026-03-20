'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/data/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PaymentFlowModal } from '@/components/fees/PaymentFlowModal';
import {
  WizardFormData,
} from '@/components/forms/FormWizard';
import {
  IndianRupee,
  CreditCard,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  InfoIcon,
} from 'lucide-react';

interface FeeTopupStepProps {
  data: WizardFormData;
  onChange: (key: string, value: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
  saving?: boolean;
}

interface FeeBreakdown {
  id: string;
  name: string;
  description: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export const FeeTopupStep: React.FC<FeeTopupStepProps> = ({
  data,
  onChange,
  errors,
  setErrors,
  isValid,
  setIsValid,
  saving,
}) => {
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRenewalFees = async () => {
      try {
        setLoading(true);
        const studentId = data.studentId || 'STU001';
        const response = await fetch(`/api/fees?student_id=${studentId}&type=renewal`);

        if (!response.ok) {
          throw new Error('Failed to fetch renewal fees');
        }

        const feesData = await response.json();

        const transformedFees: FeeBreakdown[] = feesData.map((fee: any) => ({
          id: fee.id,
          name: fee.name,
          description: fee.description || `${fee.name} for renewal period`,
          amount: fee.amount,
          paidAmount: fee.paid_amount || 0,
          status: fee.status,
        }));

        setFeeBreakdown(transformedFees);
        setFetchError(null);
      } catch (err) {
        console.error('Error fetching renewal fees:', err);
        setFetchError('Failed to load fee information.');
      } finally {
        setLoading(false);
      }
    };

    fetchRenewalFees();
  }, [data.studentId]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const totalAmount = feeBreakdown.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = feeBreakdown.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const outstanding = totalAmount - totalPaid;

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: '📱',
      description: 'Pay using UPI apps (GPay, PhonePe, Paytm)',
      processingTime: 'Instant',
    },
    {
      id: 'qr',
      name: 'QR Code',
      icon: '🖼️',
      description: 'Scan QR code with any UPI app',
      processingTime: 'Instant',
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'Direct bank transfer',
      processingTime: '1-2 hours',
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      icon: '💳',
      description: 'Visa, Mastercard, RuPay',
      processingTime: 'Instant',
    },
  ];

  const handlePayment = useCallback((amount: number) => {
    setPaymentAmount(amount);
    setIsPaymentModalOpen(true);
  }, []);

  const handlePaymentComplete = useCallback(() => {
    setPaymentComplete(true);
    onChange('paymentComplete', true);
    setIsValid(true);
  }, [onChange, setIsValid]);

  const handleMethodSelect = useCallback((methodId: string) => {
    setSelectedMethod(methodId);
    onChange('paymentMethod', methodId);
  }, [onChange]);

  React.useEffect(() => {
    setIsValid(paymentComplete);
  }, [paymentComplete, setIsValid]);

  if (paymentComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Payment Successful
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your renewal fee payment has been processed successfully.
          </p>
        </div>

        <Card padding="md" shadow="sm">
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Transaction ID</span>
              <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                TXN-{Date.now()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                ₹{outstanding.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Payment Method</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {paymentMethods.find((m) => m.id === selectedMethod)?.name || 'UPI'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Date & Time</span>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date().toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </Card>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Payment Confirmed</p>
              <p className="text-sm text-green-700">
                A receipt has been generated and sent to your registered email.
                You can also download it from the Documents section.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading fee information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-2">{fetchError}</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Fee Top-up Payment
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Complete your renewal fee payment to secure your accommodation for the next 6 months.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Already Paid</span>
          </div>
          <p className="text-xl font-bold text-green-600">
            ₹{totalPaid.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Amount Due</span>
          </div>
          <p className="text-xl font-bold text-blue-600">
            ₹{outstanding.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <Card padding="md" shadow="sm">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Fee Breakdown
        </h3>
        <div className="space-y-3">
          {feeBreakdown.map((fee) => (
            <div
              key={fee.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {fee.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {fee.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ₹{fee.amount.toLocaleString('en-IN')}
                </p>
                {fee.status === 'PAID' && (
                  <Badge variant="success" size="sm">Paid</Badge>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 pt-4 border-t-2" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total Due</span>
            <span className="text-lg font-bold text-blue-600">
              ₹{outstanding.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Card>

      <Card padding="md" shadow="sm">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Select Payment Method
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => handleMethodSelect(method.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {method.name}
                    </p>
                    {selectedMethod === method.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {method.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {method.processingTime}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {selectedMethod && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={() => handlePayment(outstanding)}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            Pay ₹{outstanding.toLocaleString('en-IN')}
          </Button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Payment Security</p>
            <p className="text-sm text-blue-700">
              All payments are processed securely through encrypted channels.
              Your financial information is protected in compliance with DPDP guidelines.
            </p>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <PaymentFlowModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          feeId="renewal-fee"
          feeName="Renewal Fee Top-up"
          amount={paymentAmount}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default FeeTopupStep;
