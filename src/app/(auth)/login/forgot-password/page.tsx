'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to process request');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-md mx-auto p-6">
        <div className="card p-8 rounded-lg shadow-sm" style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-primary)' }}>
          
          <Link href="/login" className="flex items-center text-sm mb-6 hover:underline" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
          </Link>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Reset Password
          </h1>
          <p className="text-body mb-6" style={{ color: 'var(--text-secondary)' }}>
            Enter your email or mobile number to receive a password reset link.
          </p>

          {success ? (
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Check your inbox</h3>
              <p className="text-sm text-green-700">
                We have sent a password reset link to <strong>{identifier}</strong>.
                Please check your email or SMS.
              </p>
              <div className="mt-6">
                <Link href="/login">
                  <Button variant="primary" fullWidth>Return to Login</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              <Input
                label="Email or Mobile Number"
                placeholder="Enter your registered email/mobile"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
