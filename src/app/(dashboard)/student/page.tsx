'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components';
import { ComingSoonPlaceholder } from '@/components/future/ComingSoonPlaceholder';
import { DPDPComplianceBanner } from '@/components/audit/DPDPComplianceBanner';

interface DashboardData {
  profile: {
    full_name: string;
    vertical: string;
  } | null;
  allocation: {
    status: string;
    check_in_confirmed: boolean;
    allocated_at: string;
    room_number: string | null;
  } | null;
  fees: {
    pendingAmount: number;
    nextDueDate: string | null;
  };
  renewal: {
    daysRemaining: number | null;
    dueDate: string | null;
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    profile: null,
    allocation: null,
    fees: { pendingAmount: 0, nextDueDate: null },
    renewal: { daysRemaining: null, dueDate: null },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/users/profile');
        const profileData = profileRes.ok ? await profileRes.json() : null;
        const profile = profileData?.data || profileData;

        // Fetch allocations
        const allocRes = await fetch('/api/allocations?mine=true');
        const allocResult = allocRes.ok ? await allocRes.json() : { data: [] };
        const allocations = allocResult.data || allocResult || [];
        const activeAlloc = (Array.isArray(allocations) ? allocations : []).find(
          (a: any) => a.status === 'ACTIVE'
        );

        let roomNumber: string | null = null;
        if (activeAlloc) {
          const roomsRes = await fetch('/api/rooms');
          if (roomsRes.ok) {
            const roomsResult = await roomsRes.json();
            const roomsList = roomsResult.data || roomsResult || [];
            const room = (Array.isArray(roomsList) ? roomsList : []).find(
              (r: any) => r.id === activeAlloc.room_id
            );
            roomNumber = room?.room_number || null;
          }
        }

        // Fetch fees
        const feesRes = await fetch('/api/fees?mine=true');
        const feesResult = feesRes.ok ? await feesRes.json() : { data: {} };
        const feesData = feesResult.data?.data || feesResult.data || [];
        const summary = feesResult.data?.summary || feesResult.summary || {};
        const pendingAmount = (summary.total_pending || 0) + (summary.total_overdue || 0);
        const now = new Date();
        const pendingFees = (Array.isArray(feesData) ? feesData : [])
          .filter((f: any) => f.status === 'PENDING' && new Date(f.due_date) > now)
          .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        const nextDueDate = pendingFees.length > 0 ? pendingFees[0].due_date : null;

        // Fetch renewals
        const renewalsRes = await fetch('/api/renewals');
        const renewalsResult = renewalsRes.ok ? await renewalsRes.json() : { data: [] };
        const renewalsData = renewalsResult.data || renewalsResult || [];
        const studentRenewal = (Array.isArray(renewalsData) ? renewalsData : []).find(
          (r: any) => r.student_id === profile?.id
        );

        setData({
          profile: profile ? { full_name: profile.full_name, vertical: profile.vertical } : null,
          allocation: activeAlloc
            ? {
                status: activeAlloc.check_in_confirmed ? 'CHECKED_IN' : 'ALLOCATED',
                check_in_confirmed: activeAlloc.check_in_confirmed,
                allocated_at: activeAlloc.allocated_at,
                room_number: roomNumber,
              }
            : null,
          fees: { pendingAmount, nextDueDate },
          renewal: {
            daysRemaining: studentRenewal?.days_remaining ?? null,
            dueDate: studentRenewal?.renewal_due_date ?? null,
          },
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const verticalMap: Record<string, string> = {
    BOYS: 'Boys Hostel',
    GIRLS: 'Girls Ashram',
    DHARAMSHALA: 'Dharamshala',
  };

  const vertical = verticalMap[data.profile?.vertical || ''] || data.profile?.vertical || 'Boys Hostel';
  const status = data.allocation?.status || 'NOT_ALLOCATED';
  const roomNumber = data.allocation?.room_number || null;
  const joiningDate = data.allocation?.allocated_at || null;
  const renewalDaysRemaining = data.renewal.daysRemaining;
  const renewalDueDate = data.renewal.dueDate;
  const pendingFeeAmount = data.fees.pendingAmount;
  const feeDueDate = data.fees.nextDueDate;

  // Derive academic year and period
  const allocationDate = joiningDate ? new Date(joiningDate) : new Date();
  const year = allocationDate.getFullYear();
  const month = allocationDate.getMonth();
  const ayStart = month >= 5 ? year : year - 1;
  const academicYear = `${ayStart}-${String(ayStart + 1).slice(2)}`;
  const currentMonth = new Date().getMonth();
  const currentPeriod = currentMonth >= 5 && currentMonth <= 10 ? 'SEMESTER 1' : 'SEMESTER 2';

  const getStatusDisplay = () => {
    switch (status) {
      case 'CHECKED_IN':
        return { label: 'Checked-in', color: 'var(--color-green-600)' };
      case 'ALLOCATED':
        return { label: 'Room Allocated', color: 'var(--color-blue-600)' };
      case 'NOT_ALLOCATED':
        return { label: 'Pending Allocation', color: 'var(--color-gold-600)' };
      default:
        return { label: status, color: 'var(--color-gray-600)' };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-page)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-page)' }} className="min-h-screen">
      <main className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 p-6 rounded-lg" style={{ background: 'var(--surface-primary)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-heading-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                  Welcome, {data.profile?.full_name || 'Student'}!
                </h2>
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  You are logged in as <strong>{data.profile?.full_name || 'Student'}</strong> at <strong>{vertical}</strong>
                </p>
                <p className="text-body-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Academic Year: <strong>{academicYear || 'N/A'}</strong> | Current Period: <strong>{currentPeriod || 'N/A'}</strong>
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: statusDisplay.color }}>
                {statusDisplay.label}
              </span>
            </div>
          </div>

          {renewalDaysRemaining !== null && renewalDaysRemaining <= 30 && (
            <div className="mb-8 p-4 rounded-lg border-l-4" style={{ background: 'var(--bg-page)', borderLeftColor: 'var(--color-gold-500)' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="text-heading-4 mb-2" style={{ color: 'var(--text-primary)' }}>
                    DPDP Consent Renewal Required
                  </h3>
                  <p className="text-body-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Your 6-month stay renewal is approaching. Please review and update your Data Protection and Privacy Principles consent before completing your renewal.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="primary" size="sm">
                      Review Consent
                    </Button>
                    <a href="/dpdp-policy" className="text-sm" style={{ color: 'var(--text-link)' }}>
                      Read Full Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Pay Fees</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>View and pay your pending dues</p>
              <Button variant="primary" size="md" fullWidth onClick={() => router.push('/dashboard/student/fees')}>Go to Fees</Button>
            </div>

            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Download Letters</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Get admission and official documents</p>
              <Button variant="primary" size="md" fullWidth onClick={() => router.push('/dashboard/student/documents')}>View Documents</Button>
            </div>

            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">🏖️</div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Apply for Leave</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Request leave from hostel</p>
              <Button variant="primary" size="md" fullWidth onClick={() => router.push('/dashboard/student/leave')}>Apply Leave</Button>
            </div>

            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">🛏️</div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Room Details</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>View your room information</p>
              <Button variant="primary" size="md" fullWidth onClick={() => router.push('/dashboard/student/room')}>View Room</Button>
            </div>

            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">📜</div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Renewal</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Renew your stay for next semester</p>
              <Button variant="primary" size="md" fullWidth onClick={() => router.push('/dashboard/student/renewal')}>
                Renew Now
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-heading-3 mb-4" style={{ color: 'var(--text-primary)' }}>Coming Soon</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <ComingSoonPlaceholder
                title="Biometric Attendance"
                description="Mark attendance via fingerprint or face scan"
                icon="👆"
                estimatedLaunch="Q2 2026"
                featureFlag="FEAT_BIOMETRIC_ATTENDANCE"
              />
              <ComingSoonPlaceholder
                title="Mess Management"
                description="View menus, track attendance, manage food preferences"
                icon="🍽️"
                estimatedLaunch="Q1 2026"
                featureFlag="FEAT_MESS_MANAGEMENT"
              />
              <ComingSoonPlaceholder
                title="Visitor Management"
                description="Pre-register visitors and manage gate passes"
                icon="👥"
                estimatedLaunch="Q3 2026"
                featureFlag="FEAT_VISITOR_MANAGEMENT"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 mb-8">
            <div className="card p-6 md:col-span-2">
              <h3 className="text-heading-4 mb-4" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
              <div className="space-y-3">
                {pendingFeeAmount > 0 && feeDueDate && (
                  <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--bg-page)' }}>
                    <span className="text-red-500 text-lg">⚠</span>
                    <div>
                      <p className="text-body font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Fee payment due</p>
                      <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                        Due date: {new Date(feeDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
                {renewalDaysRemaining !== null && renewalDaysRemaining <= 60 && (
                  <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--bg-page)' }}>
                    <span style={{ color: 'var(--color-gold-600)' }} className="text-lg">📢</span>
                    <div>
                      <p className="text-body font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Renewal reminder</p>
                      <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                        Your 6-month renewal is due in {renewalDaysRemaining} days
                        {renewalDueDate && ` (${new Date(renewalDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })})`}
                      </p>
                    </div>
                  </div>
                )}
                {renewalDaysRemaining !== null && renewalDaysRemaining <= 30 && (
                  <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--color-gold-50)', borderLeft: '3px solid var(--color-gold-500)' }}>
                    <span className="text-xl">🔔</span>
                    <div>
                      <p className="text-body font-medium mb-1" style={{ color: 'var(--text-primary)' }}>DPDP Consent Renewal Required</p>
                      <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Please review and accept updated DPDP consent as part of your renewal process</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-heading-4 mb-4" style={{ color: 'var(--text-primary)' }}>Quick Profile</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Room No:</span>
                <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                  {roomNumber || 'Not Allocated'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Joining Date:</span>
                <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                  {joiningDate
                    ? new Date(joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Not Available'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Academic Year:</span>
                <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>{academicYear || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Current Period:</span>
                <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>{currentPeriod || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Renewal Due:</span>
                <span className="text-body font-medium" style={{ color: renewalDaysRemaining !== null && renewalDaysRemaining <= 30 ? 'var(--color-gold-600)' : 'var(--text-primary)' }}>
                  {renewalDaysRemaining !== null ? `${renewalDaysRemaining} days` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ background: statusDisplay.color }}>
                  {statusDisplay.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DPDPComplianceBanner variant="footer" showPolicyLink={true} showRetentionLink={true} />
    </div>
  );
}
