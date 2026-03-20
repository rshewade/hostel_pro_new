import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/error-handler';
import { isMockSmsMode, MOCK_OTP_CODE } from '@/lib/auth/otp-provider';
import { auth } from '@/lib/auth';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';
import crypto from 'crypto';

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = verifyOtpSchema.parse(await req.json());

    // In mock mode, accept the fixed code
    if (isMockSmsMode()) {
      if (body.code !== MOCK_OTP_CODE) {
        throw new ValidationError('Invalid OTP code');
      }
    } else {
      // In live mode, delegate to Better Auth's phone verification
      // For now, reject unknown codes in live mode as well
      // (Better Auth plugin handles the actual verification flow)
      throw new ValidationError('Use the Better Auth phone verification flow in live mode');
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');

    return NextResponse.json({
      success: true,
      sessionToken,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
