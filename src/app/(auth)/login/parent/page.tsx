'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input, Button, cn } from '@/components';
import { OtpInput } from '@/components/forms/OtpInput';

// Parent Login Flow
// 1. Enter registered mobile number
// 2. OTP verification (POST /api/otp/send, POST /api/otp/verify)
// 3. Session creation with parent role scope
// 4. Redirect to /dashboard/parent with read-only permissions
// Note: Backend must verify mobile number is linked to a student application

export default function ParentLoginPage() {
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'loading'>('input');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [token, setToken] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) {
      setError('Please enter your registered mobile number');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    setError('');
    setStep('loading');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile, vertical: 'parent' })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token); // Store token for verification
        setAttempts(0); // Reset attempts
        setStep('otp');
        setResendTimer(60);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send OTP. Please try again.');
        setStep('input');
      }
    } catch {
      setError('Unable to connect. Please try again later.');
      setStep('input');
    }
  };

  const handleOtpSubmit = async (otpValue?: string) => {
    // Use passed value (from onComplete) or fall back to state
    const otpToVerify = otpValue || otp;

    if (!otpToVerify || otpToVerify.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setStep('loading');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: otpToVerify,
          token: token,
          attempts: attempts,
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Pass sessionToken in URL for the dashboard to fetch student data
        const redirectUrl = data.redirect || '/dashboard/parent';
        const separator = redirectUrl.includes('?') ? '&' : '?';
        window.location.href = `${redirectUrl}${separator}sessionToken=${encodeURIComponent(data.sessionToken)}`;
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid OTP. Please try again.');
        setAttempts(prev => prev + 1);
        setStep('otp');
      }
    } catch {
      setError('Failed to verify OTP. Please try again.');
      setAttempts(prev => prev + 1);
      setStep('otp');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile, vertical: 'parent' })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setAttempts(0);
        setResendTimer(60);
        setError('');
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } catch {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="px-6 py-4 border-b bg-white">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Hirachand Gumanji Family Charitable Trust"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Hirachand Gumanji Family</h1>
              <p className="text-caption">Charitable Trust</p>
            </div>
          </div>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            ← Back to Login
          </Link>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="mx-auto max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Parent/Guardian Login</h2>
              <p className="text-gray-600">View your ward&apos;s hostel information and status</p>
            </div>

            {step === 'input' && (
              <form onSubmit={handleMobileSubmit} className="space-y-6">
                <Input
                  id="mobile"
                  label="Registered Mobile Number"
                  type="tel"
                  inputMode="numeric"
                  placeholder="+91XXXXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required
                  helperText="Enter the mobile number registered with your ward's hostel application"
                  autoFocus
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Send OTP
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    Enter OTP sent to <span className="font-semibold">{mobile}</span>
                  </p>
                </div>

                <OtpInput
                  length={6}
                  onChange={(value) => setOtp(value)}
                  onComplete={handleOtpSubmit}
                  error={error}
                  disabled={false}
                />

                <div className="flex justify-between items-center mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError('');
                    }}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    ← Change mobile number
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className={cn(
                      'text-sm',
                      resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:underline font-medium'
                    )}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {step === 'loading' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Processing...</p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">View-Only Access</h4>
                  <p className="text-sm text-blue-700">
                    Parent accounts have read-only access to view your ward&apos;s hostel information.
                    You cannot make changes or approve requests through this portal.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Secure Login</h4>
                  <p className="text-sm text-gray-600">
                    Your mobile number is used only to verify your identity and retrieve your ward&apos;s information.
                    All data transmission is encrypted and complies with DPDP Act, 2023.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact the hostel administration at{' '}
                <a href="tel:+912224141234" className="text-blue-600 hover:underline">+91 22 2414 1234</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
