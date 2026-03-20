'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/data/Card';
import { Badge } from '@/components/ui/Badge';
import { IndianRupeeIcon } from '@/components/ui/IconIndianRupee';
import { CreditCardIcon } from '@/components/ui/IconCreditCard';
import { FileTextIcon } from '@/components/ui/IconFileText';
import { PaymentFlowModal } from '@/components/fees/PaymentFlowModal';

interface FeeItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'OVERDUE';
  dueDate: string;
}

interface PaymentSummary {
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  nextDueDate: string;
}

export default function StudentFeesPage() {
  const [vertical] = useState('Boys Hostel');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<{ id: string; name: string; amount: number } | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{ name: string; email: string; phone: string; vertical: string; academicYear: string }>({
    name: '', email: '', phone: '', vertical: '', academicYear: '',
  });

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);

        // Fetch profile for receipt data
        try {
          const profileRes = await fetch('/api/users/profile');
          if (profileRes.ok) {
            const profileResult = await profileRes.json();
            const userData = profileResult.data || profileResult;
            const verticalMap: Record<string, string> = { 'BOYS': 'Boys Hostel', 'GIRLS': 'Girls Ashram', 'DHARAMSHALA': 'Dharamshala' };
            const now = new Date();
            const ayStart = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
            setProfileData({
              name: userData.full_name || '',
              email: userData.email || '',
              phone: userData.mobile || '',
              vertical: verticalMap[userData.vertical] || userData.vertical || '',
              academicYear: `${ayStart}-${String(ayStart + 1).slice(2)}`,
            });
          }
        } catch (e) {
          // Non-critical - receipt will show blank fields
        }

        const response = await fetch('/api/fees?mine=true');

        if (!response.ok) {
          throw new Error('Failed to fetch fees');
        }

        const result = await response.json();
        const feesData = result.data?.data || result.data || [];

        const transformedFees: FeeItem[] = (Array.isArray(feesData) ? feesData : []).map((fee: any) => ({
          id: fee.id,
          name: fee.name,
          description: fee.description || `${fee.name} for current period`,
          amount: fee.amount,
          paidAmount: fee.paid_amount || 0,
          status: fee.status,
          dueDate: fee.due_date,
        }));

        setFeeItems(transformedFees);

        // Also fetch payment history
        try {
          const paymentsResponse = await fetch('/api/payments?mine=true');
          if (paymentsResponse.ok) {
            const paymentsResult = await paymentsResponse.json();
            const paymentsData = paymentsResult.data?.data || paymentsResult.data || [];
            setPaymentHistory(Array.isArray(paymentsData) ? paymentsData : []);
          }
        } catch (paymentErr) {
          console.error('Error fetching payments:', paymentErr);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching fees:', err);
        setError('Failed to load fee information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, []);

  const paymentSummary: PaymentSummary = {
    totalAmount: feeItems.reduce((sum, item) => sum + item.amount, 0),
    totalPaid: feeItems.reduce((sum, item) => sum + item.paidAmount, 0),
    outstanding: feeItems.reduce((sum, item) => sum + (item.amount - item.paidAmount), 0),
    nextDueDate: feeItems.filter(item => item.status !== 'PAID').sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0]?.dueDate || 'N/A',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="md">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="warning" size="md">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="error" size="md">Failed</Badge>;
      case 'OVERDUE':
        return <Badge variant="error" size="md">Overdue</Badge>;
      default:
        return <Badge variant="default" size="md">{status}</Badge>;
    }
  };

  const handlePayNow = (itemId: string) => {
    const fee = feeItems.find((item) => item.id === itemId);
    if (fee) {
      setSelectedPaymentId(itemId);
      setSelectedFee({
        id: fee.id,
        name: fee.name,
        amount: fee.amount - fee.paidAmount,
      });
      setIsPaymentModalOpen(true);
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPaymentId(null);
    setSelectedFee(null);
  };

  const handlePaymentComplete = async () => {
    try {
      const updatedFeeItems = feeItems.map((item) =>
        item.id === selectedPaymentId
          ? { ...item, paidAmount: item.amount, status: 'PAID' as const }
          : item
      );
      setFeeItems(updatedFeeItems);
      setIsPaymentModalOpen(false);
      setSelectedPaymentId(null);
      setSelectedFee(null);
      alert('Payment successful! Receipt generated.');
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      <main className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 p-6 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Fee Payments
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--bg-accent)', color: 'var(--text-on-accent)' }}>
                {vertical}
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Fee Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupeeIcon className="w-5 h-5" color="var(--color-blue-600)" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  ₹{paymentSummary.totalAmount.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCardIcon className="w-5 h-5" color="var(--color-green-600)" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-green-600)' }}>
                  ₹{paymentSummary.totalPaid.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupeeIcon className="w-5 h-5" color="var(--color-gold-600)" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Outstanding</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-gold-600)' }}>
                  ₹{paymentSummary.outstanding.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-page)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileTextIcon className="w-5 h-5" color="var(--text-primary)" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Next Due Date</span>
                </div>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {paymentSummary.nextDueDate !== 'N/A' ? new Date(paymentSummary.nextDueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'No pending dues'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Fee Details
              </h3>
            </div>

            {loading ? (
              <Card padding="lg" shadow="md">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mx-auto mb-4"></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading fee information...</p>
                  </div>
                </div>
              </Card>
            ) : error ? (
              <Card padding="lg" shadow="md">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                </div>
              </Card>
            ) : feeItems.length === 0 ? (
              <Card padding="lg" shadow="md">
                <div className="flex items-center justify-center py-8">
                  <p style={{ color: 'var(--text-secondary)' }}>No fee items found.</p>
                </div>
              </Card>
            ) : null}

            {!loading && !error && feeItems.map((item) => (
              <Card
                key={item.id}
                padding="lg"
                shadow="md"
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {item.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Total Amount
                        </p>
                        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Paid
                        </p>
                        <p className="text-base font-semibold" style={{ color: 'var(--color-green-600)' }}>
                          ₹{item.paidAmount.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Outstanding
                        </p>
                        <p className="text-base font-semibold" style={{ color: item.status === 'PAID' ? 'var(--color-green-600)' : 'var(--color-gold-600)' }}>
                          ₹{(item.amount - item.paidAmount).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Due Date
                        </p>
                        <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                          {new Date(item.dueDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {item.status !== 'PAID' && (
                    <div className="flex-shrink-0">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handlePayNow(item.id)}
                      >
                        Pay Now
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Payment History
              </h3>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Showing last 3 payments
              </span>
            </div>

            <Card padding="md" shadow="md">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Transaction ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Fee Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Method
                      </th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                          No payment history found
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.slice(0, 3).map((payment: any, index: number) => (
                        <tr key={payment.id || index} style={{ borderBottom: index < paymentHistory.length - 1 ? '1px solid var(--border-primary)' : undefined }}>
                          <td className="py-3 px-4">
                            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                              {payment.transaction_id || `TXN-${payment.id?.slice(0, 8)}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                            {payment.notes || 'Fee Payment'}
                          </td>
                          <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                            ₹{Number(payment.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                            {payment.payment_method || 'N/A'}
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                            {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : 'Pending'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={payment.status === 'PAID' ? 'success' : payment.status === 'PENDING' ? 'warning' : 'error'} size="sm">
                              {payment.status || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="xs" disabled={payment.status !== 'PAID'} onClick={() => {}}>
                              {payment.status === 'PAID' ? 'Download' : 'Pending'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="mt-8 p-4 rounded-lg" style={{ background: 'var(--bg-page)', borderLeft: '4px solid var(--color-blue-500)' }}>
            <div className="flex items-start gap-3">
              <FileTextIcon className="w-5 h-5 mt-0.5 flex-shrink-0" color="var(--color-blue-600)" />
              <div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Data Protection and Financial Privacy Notice
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Your payment information is encrypted and processed securely in compliance with Data Protection and Privacy Principles (DPDP) Act. All transactions are logged with timestamps for audit purposes. Your financial data is stored securely and will only be used for fee management purposes. For any queries regarding your payments, please contact the Accounts department.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Need help? Contact <a href="mailto:accounts@jainhostel.edu" className="underline">accounts@jainhostel.edu</a> or call +91 12345 67890
            </p>
          </div>
        </div>
      </main>

      {selectedFee && (
        <PaymentFlowModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          feeId={selectedFee.id}
          feeName={selectedFee.name}
          amount={selectedFee.amount}
          payerName={profileData.name}
          payerEmail={profileData.email}
          payerPhone={profileData.phone}
          payerVertical={profileData.vertical}
          academicYear={profileData.academicYear}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
