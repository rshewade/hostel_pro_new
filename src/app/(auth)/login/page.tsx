'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components';

type LoginFormData = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign in via Better Auth
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.username,
          password: formData.password,
        }),
      });

      const responseBody = await response.json();

      if (response.ok && responseBody.user) {
        // Small delay to ensure session cookie is set by the browser
        await new Promise(resolve => setTimeout(resolve, 100));

        // Fetch user role from our app users table
        const profileRes = await fetch('/api/users/profile');
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const redirectPath = getRoleRedirectPath(profile?.role || 'STUDENT');
          router.push(redirectPath);
        } else {
          // New user without profile — default to student dashboard
          router.push('/student');
        }
      } else {
        setError(responseBody.message || 'Invalid credentials or account not found');
      }
    } catch (_err) {
      setError('Unable to connect. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleRedirectPath = (role: string): string => {
    switch (role.toUpperCase()) {
      case 'STUDENT':
        return '/student';
      case 'SUPERINTENDENT':
        return '/superintendent';
      case 'TRUSTEE':
        return '/trustee';
      case 'ACCOUNTS':
        return '/accounts';
      case 'PARENT':
        return '/parent';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-md mx-auto p-6">
        {/* Header with branding */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Seth Hirachand Gumanji Jain Hostel"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1
            className="text-heading-1 mb-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            Welcome Back
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Role Selection Indicator */}
        <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-body-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> Login is available for Students, Superintendents, Trustees, Accounts, and Parents.
            Please use the credentials shared with you.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border-l-4" style={{ borderLeftColor: 'var(--color-red-500)' }}>
            <p className="text-body-sm" style={{ color: 'var(--color-red-700)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username/Email/Mobile Field */}
          <Input
            type="text"
            label="Username, Email, or Mobile Number"
            placeholder="Enter your username, email, or mobile"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            autoFocus
            autoComplete="username"
          />

          {/* Password Field */}
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            autoComplete="current-password"
          />

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link
              href="/login/forgot-password"
              className="text-sm hover:underline"
              style={{ color: 'var(--text-link)' }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

        {/* Parent/Guardian Login Link */}
        <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-body-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Are you a parent/guardian?
          </p>
          <Link
            href="/login/parent"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--text-link)' }}
          >
            Use OTP-based Parent Login →
          </Link>
        </div>
        </form>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-body-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Back to Home
          </Link>
        </div>

        {/* Institutional Rules Notice */}
        <div className="mt-8 p-4 rounded-lg border" style={{ borderColor: 'var(--border-primary)' }}>
          <h3 className="text-heading-4 mb-2" style={{ color: 'var(--text-primary)' }}>
            Institutional Usage Rules
          </h3>
          <ul className="space-y-2 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>• This system is for authorized use only</li>
            <li>• All login attempts are logged for security purposes</li>
            <li>• Immediate report of unauthorized access is required</li>
            <li>• Password must be kept confidential and not shared</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
